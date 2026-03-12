document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('booking-form');
    const bookingDateInput = document.getElementById('booking-date');
    const guestsInput = document.getElementById('guests');
    const formMessage = document.getElementById('form-message');
    const discountMessage = document.getElementById('discount-message');
    const bookingsHistoryContainer = document.getElementById('bookings-history');
    const historyMessage = document.getElementById('history-message');

    const BASE_PRICE_PER_GUEST = 20; // Matches server-side
    const EARLY_BOOKING_DISCOUNT_PERCENT = 0.10; // Matches server-side

    // Function to display messages
    function displayMessage(element, message, type) {
        element.textContent = message;
        element.className = `message ${type}`;
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message';
        }, 5000);
    }

    // Function to format date for display
    function formatDate(dateString) {
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Function to calculate and display potential discount
    function checkDiscount() {
        const bookingDateValue = bookingDateInput.value;
        const guests = parseInt(guestsInput.value, 10);

        if (!bookingDateValue || isNaN(guests) || guests < 1) {
            discountMessage.textContent = '';
            discountMessage.style.display = 'none';
            return;
        }

        const bookingDate = new Date(bookingDateValue);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today to start of day for comparison

        const diffTime = bookingDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Difference in days

        let originalPrice = guests * BASE_PRICE_PER_GUEST;
        let finalPrice = originalPrice;
        let discountApplies = false;

        if (bookingDate > today && diffDays >= 5) {
            finalPrice = originalPrice * (1 - EARLY_BOOKING_DISCOUNT_PERCENT);
            discountApplies = true;
        }

        if (discountApplies) {
            discountMessage.textContent = `🥳 Book 5+ days early! Original Price: $${originalPrice.toFixed(2)}, Discounted Price: $${finalPrice.toFixed(2)} (10% off)`;
            discountMessage.className = 'message discount-info';
            discountMessage.style.display = 'block';
        } else if (bookingDate < today) {
            discountMessage.textContent = 'Selected date is in the past.';
            discountMessage.className = 'message error';
            discountMessage.style.display = 'block';
        }
        else {
            discountMessage.textContent = `Current Price: $${originalPrice.toFixed(2)}`;
            discountMessage.className = 'message';
            discountMessage.style.display = 'block';
        }
    }

    // Event listeners for discount preview
    bookingDateInput.addEventListener('change', checkDiscount);
    guestsInput.addEventListener('change', checkDiscount);
    guestsInput.addEventListener('keyup', checkDiscount);


    // Handle booking form submission
    bookingForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const date = document.getElementById('booking-date').value;
        const time = document.getElementById('booking-time').value;
        const guests = parseInt(document.getElementById('guests').value, 10);

        if (!name || !email || !date || !time || isNaN(guests) || guests < 1) {
            displayMessage(formMessage, 'Please fill in all required fields and ensure guests is a valid number.', 'error');
            return;
        }
        
        // Basic date validation: ensure booking date and time is not in the past
        const bookingDateTime = new Date(`${date}T${time}`);
        const now = new Date();
        if (bookingDateTime < now) {
            displayMessage(formMessage, 'Booking date and time cannot be in the past.', 'error');
            return;
        }


        try {
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, phone, date, time, guests })
            });

            const data = await response.json();
            if (response.ok) {
                displayMessage(formMessage, `Booking confirmed for ${name}! ${data.discountApplied ? 'Discount applied!' : ''} Final Price: $${data.finalPrice.toFixed(2)}`, 'success');
                bookingForm.reset(); // Clear the form
                discountMessage.textContent = ''; // Clear discount message
                discountMessage.className = 'message';
                fetchBookings(); // Refresh bookings history
            } else {
                displayMessage(formMessage, `Error: ${data.error || 'Something went wrong.'}`, 'error');
            }
        } catch (error) {
            console.error('Network error saving booking:', error);
            displayMessage(formMessage, 'Network error. Please try again.', 'error');
        }
    });

    // Fetch and display past/upcoming bookings
    async function fetchBookings() {
        bookingsHistoryContainer.innerHTML = '<p>Loading bookings...</p>';
        try {
            const response = await fetch('/api/history');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const bookings = await response.json();

            if (bookings.length === 0) {
                bookingsHistoryContainer.innerHTML = '<p>No bookings yet.</p>';
            } else {
                const ul = document.createElement('ul');
                const now = new Date();
                now.setHours(0,0,0,0); // Normalize to start of day for comparison

                bookings.forEach(booking => {
                    const bookingDate = new Date(booking.date);
                    const bookingDateTime = new Date(`${booking.date}T${booking.time}`);

                    const li = document.createElement('li');
                    let priceText = `$${booking.finalPrice.toFixed(2)}`;
                    let priceClass = '';
                    if (booking.discountApplied) {
                        priceText = `<del>$${booking.originalPrice.toFixed(2)}</del> $${booking.finalPrice.toFixed(2)}`;
                        priceClass = 'discount';
                    }

                    let statusIndicator = '';
                    if (bookingDateTime < new Date()) {
                        statusIndicator = ' (Past)';
                    } else if (bookingDate.getTime() === now.getTime()) {
                         statusIndicator = ' (Today)';
                    } else if (bookingDate > now) {
                        statusIndicator = ' (Upcoming)';
                    }

                    li.innerHTML = `
                        <div class="booking-details">
                            <span class="booking-name">${booking.name}</span>
                            <span class="booking-date-time">${formatDate(booking.date)} at ${booking.time}${statusIndicator}</span>
                        </div>
                        <span class="booking-guests">${booking.guests} Guests</span>
                        <span class="booking-price ${priceClass}">Total: ${priceText}</span>
                    `;
                    ul.appendChild(li);
                });
                bookingsHistoryContainer.innerHTML = '';
                bookingsHistoryContainer.appendChild(ul);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            bookingsHistoryContainer.innerHTML = '<p class="message error">Failed to load bookings.</p>';
        }
    }

    // Initial load: fetch past and upcoming bookings
    fetchBookings();
    
    // Set min date for booking date input to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
    const dd = String(today.getDate()).padStart(2, '0');
    bookingDateInput.min = `${yyyy}-${mm}-${dd}`;
    bookingDateInput.value = `${yyyy}-${mm}-${dd}`; // Default to today
    
    // Initial discount check on page load if default date is set
    checkDiscount();
});