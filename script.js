const menu = [
    { name: 'Espresso', price: 2.50 },
    { name: 'Latte', price: 4.00 },
    { name: 'Cappuccino', price: 3.75 },
    { name: 'Americano', price: 3.00 },
    { name: 'Mocha', price: 4.50 },
    { name: 'Croissant', price: 3.20 },
    { name: 'Muffin', price: 2.80 },
    { name: 'Cold Brew', price: 4.25 },
    { name: 'Iced Tea', price: 3.00 }
];

let currentOrder = [];

const customerNameInput = document.getElementById('customer-name');
const menuItemsContainer = document.getElementById('menu-items-container');
const currentOrderList = document.getElementById('current-order-list');
const totalAmountSpan = document.getElementById('total-amount');
const placeOrderBtn = document.getElementById('place-order-btn');
const orderHistoryList = document.getElementById('order-history-list');

function renderMenu() {
    menuItemsContainer.innerHTML = '';
    menu.forEach(item => {
        const menuItemDiv = document.createElement('div');
        menuItemDiv.classList.add('menu-item');
        menuItemDiv.innerHTML = `
            <h3>${item.name}</h3>
            <p>$${item.price.toFixed(2)}</p>
        `;
        menuItemDiv.addEventListener('click', () => addItemToOrder(item));
        menuItemsContainer.appendChild(menuItemDiv);
    });
}

function addItemToOrder(item) {
    const existingItem = currentOrder.find(orderItem => orderItem.name === item.name);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        currentOrder.push({ ...item, quantity: 1 });
    }
    renderCurrentOrder();
}

function updateItemQuantity(itemName, change) {
    const itemIndex = currentOrder.findIndex(orderItem => orderItem.name === itemName);
    if (itemIndex > -1) {
        currentOrder[itemIndex].quantity += change;
        if (currentOrder[itemIndex].quantity <= 0) {
            currentOrder.splice(itemIndex, 1);
        }
    }
    renderCurrentOrder();
}

function renderCurrentOrder() {
    currentOrderList.innerHTML = '';
    let total = 0;

    if (currentOrder.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.classList.add('empty-order-message');
        emptyMessage.textContent = 'No items in your order yet.';
        currentOrderList.appendChild(emptyMessage);
    } else {
        currentOrder.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="order-item-details">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <div class="order-item-controls">
                    <button data-name="${item.name}" data-change="-1" class="qty-btn">-</button>
                    <button data-name="${item.name}" data-change="1" class="qty-btn">+</button>
                    <button data-name="${item.name}" class="remove-btn">Remove</button>
                </div>
            `;
            currentOrderList.appendChild(li);
            total += item.price * item.quantity;
        });
    }

    totalAmountSpan.textContent = total.toFixed(2);

    // Add event listeners for quantity controls and remove buttons
    currentOrderList.querySelectorAll('.qty-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const itemName = event.target.dataset.name;
            const change = parseInt(event.target.dataset.change);
            updateItemQuantity(itemName, change);
        });
    });

    currentOrderList.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const itemName = event.target.dataset.name;
            const itemIndex = currentOrder.findIndex(orderItem => orderItem.name === itemName);
            if (itemIndex > -1) {
                currentOrder.splice(itemIndex, 1);
                renderCurrentOrder();
            }
        });
    });
}

async function placeOrder() {
    const customerName = customerNameInput.value.trim();
    if (!customerName) {
        alert('Please enter your name before placing an order.');
        return;
    }

    if (currentOrder.length === 0) {
        alert('Your order is empty. Please add some items.');
        return;
    }

    const totalAmount = parseFloat(totalAmountSpan.textContent);

    const orderData = {
        customerName: customerName,
        items: currentOrder.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
        totalAmount: totalAmount
    };

    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save order.');
        }

        const result = await response.json();
        alert('Order placed successfully! Thank you, ' + customerName + '!');
        
        // Clear current order and input
        currentOrder = [];
        customerNameInput.value = '';
        renderCurrentOrder();
        fetchOrderHistory(); // Refresh history

    } catch (error) {
        console.error('Error placing order:', error);
        alert('There was an error placing your order: ' + error.message);
    }
}

async function fetchOrderHistory() {
    try {
        const response = await fetch('/api/history');
        if (!response.ok) {
            throw new Error('Failed to fetch order history.');
        }
        const history = await response.json();
        renderOrderHistory(history);
    } catch (error) {
        console.error('Error fetching order history:', error);
        orderHistoryList.innerHTML = `<li class="empty-history-message" style="color: red;">Error loading history: ${error.message}</li>`;
    }
}

function renderOrderHistory(history) {
    orderHistoryList.innerHTML = '';
    if (history.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.classList.add('empty-history-message');
        emptyMessage.textContent = 'No past orders found.';
        orderHistoryList.appendChild(emptyMessage);
        return;
    }

    history.forEach(order => {
        const li = document.createElement('li');
        const orderDate = new Date(order.orderDate).toLocaleString();
        
        let itemsHtml = '';
        order.items.forEach(item => {
            itemsHtml += `<li>${item.name} x ${item.quantity} ($${(item.price * item.quantity).toFixed(2)})</li>`;
        });

        li.innerHTML = `
            <strong>Customer:</strong> ${order.customerName}<br>
            <strong>Date:</strong> ${orderDate}<br>
            <strong>Total:</strong> $${order.totalAmount.toFixed(2)}
            <p><strong>Items:</strong></p>
            <ul class="history-items">${itemsHtml}</ul>
        `;
        orderHistoryList.appendChild(li);
    });
}

// Event Listeners
placeOrderBtn.addEventListener('click', placeOrder);

// Initial renders on page load
document.addEventListener('DOMContentLoaded', () => {
    renderMenu();
    renderCurrentOrder();
    fetchOrderHistory();
});
