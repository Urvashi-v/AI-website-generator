require('dotenv').config();
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.static(path.join(__dirname))); // Serve static files from the current directory

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Mongoose Schema for Bookings
const bookingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String, // HH:MM format
        required: true
    },
    guests: {
        type: Number,
        required: true,
        min: 1
    },
    originalPrice: {
        type: Number, // Base price before discount
        required: true
    },
    discountApplied: {
        type: Boolean,
        default: false
    },
    finalPrice: {
        type: Number, // Price after discount
        required: true
    },
    bookingTimestamp: { // When the booking was made
        type: Date,
        default: Date.now
    }
});

const Booking = mongoose.model('Booking', bookingSchema);

// Base price per guest (for calculation)
const BASE_PRICE_PER_GUEST = 20; // $20 per guest
const EARLY_BOOKING_DISCOUNT_PERCENT = 0.10; // 10% discount

// API Endpoint: Save a new booking (POST)
app.post('/api/save', async (req, res) => {
    try {
        const { name, email, phone, date, time, guests } = req.body;

        if (!name || !email || !date || !time || !guests || guests < 1) {
            return res.status(400).json({ error: 'Missing or invalid booking data.' });
        }

        const bookingDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today to start of day for comparison

        const diffTime = bookingDate.getTime() - today.getTime(); // Difference in milliseconds
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let originalPrice = guests * BASE_PRICE_PER_GUEST;
        let finalPrice = originalPrice;
        let discountApplied = false;

        // Apply discount if booking is 5 days or more in advance
        if (bookingDate > today && diffDays >= 5) {
            finalPrice = originalPrice * (1 - EARLY_BOOKING_DISCOUNT_PERCENT);
            discountApplied = true;
        }

        const newBooking = new Booking({
            name,
            email,
            phone: phone || '',
            date: bookingDate,
            time,
            guests,
            originalPrice,
            discountApplied,
            finalPrice
        });

        const savedBooking = await newBooking.save();
        res.status(201).json({
            message: 'Booking saved successfully!',
            bookingId: savedBooking._id,
            discountApplied: savedBooking.discountApplied,
            finalPrice: savedBooking.finalPrice
        });
    } catch (error) {
        console.error('Error saving booking:', error);
        res.status(500).json({ error: 'Failed to save booking.', details: error.message });
    }
});

// API Endpoint: Get past and upcoming bookings (GET)
app.get('/api/history', async (req, res) => {
    try {
        // Sort by date ascending (upcoming first), then time
        const bookings = await Booking.find().sort({ date: 1, time: 1 }).limit(50); // Get latest 50 bookings
        res.status(200).json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings.' });
    }
});

// Serve the index.html for any other requests (SPA fallback)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});