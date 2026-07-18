// server.js

// 1. THIS LOADS THE .ENV FILE AUTOMATICALLY
import 'dotenv/config'; 

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

import productRoutes from './Routes/productRoutes.js';
import adminRoutes from './Routes/adminRoutes.js';
import aiRoutes from './Routes/aiRoutes.js';
import orderRoutes from './Routes/orderRoutes.js';
import razorpayRoutes from './Routes/razorpayRoutes.js';

// ---------------------
// Init Express app
// ---------------------
const app = express();

// ---------------------
// Setup __dirname for ES Modules
// ---------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------
// Middleware
// ---------------------
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Serve static files (uploads folder)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------------------
// Routes
// ---------------------
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/razorpay', razorpayRoutes);

// ---------------------
// Connect DB & Start Server
// ---------------------
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
