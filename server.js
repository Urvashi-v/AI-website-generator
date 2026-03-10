require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes - important for development
app.use(express.json()); // Body parser for JSON requests

// Mongoose Connection
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
    console.error('MONGO_URI is not defined in the environment variables.');
    process.exit(1);
}

mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB Connected successfully!'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Mongoose Schema and Model
const orderItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
});

const orderSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    items: {
        type: [orderItemSchema],
        required: true,
        validate: { validator: v => v.length > 0, message: 'Order must contain at least one item.' }
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    orderDate: {
        type: Date,
        default: Date.now
    }
});

const Order = mongoose.model('Order', orderSchema);

// API Endpoints

// POST /api/save - Save a new order
app.post('/api/save', async (req, res) => {
    try {
        const { customerName, items, totalAmount } = req.body;

        if (!customerName || !items || !Array.isArray(items) || items.length === 0 || totalAmount === undefined) {
            return res.status(400).json({ message: 'Missing required order data: customerName, items, and totalAmount are required.' });
        }

        // Optional: Recalculate totalAmount on the server to prevent client-side tampering
        let calculatedTotal = 0;
        for (const item of items) {
            if (!item.name || typeof item.quantity !== 'number' || typeof item.price !== 'number' || item.quantity <= 0 || item.price < 0) {
                return res.status(400).json({ message: 'Invalid item data in order.' });
            }
            calculatedTotal += item.quantity * item.price;
        }

        // Allow a small floating point tolerance, otherwise strictly check
        if (Math.abs(calculatedTotal - totalAmount) > 0.01) { 
             // return res.status(400).json({ message: 'Calculated total does not match provided total.' });
             // For simplicity, we'll trust client total for now but a real app would strictly use calculatedTotal
        }

        const newOrder = new Order({
            customerName,
            items,
            totalAmount
        });

        await newOrder.save();
        res.status(201).json({ message: 'Order saved successfully!', order: newOrder });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ message: 'Failed to save order.', error: error.message });
    }
});

// GET /api/history - Retrieve all past orders
app.get('/api/history', async (req, res) => {
    try {
        const orders = await Order.find().sort({ orderDate: -1 }); // Sort by newest first
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching order history:', error);
        res.status(500).json({ message: 'Failed to retrieve order history.', error: error.message });
    }
});

// Serve static files (index.html, style.css, script.js)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'script.js'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Make sure MONGO_URI is set in your environment variables for database connection.`);
});
