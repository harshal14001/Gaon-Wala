// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

import productRoutes from './Routes/productRoutes.js';
import adminRoutes from './Routes/adminRoutes.js';

// ---------------------
// Setup __dirname in ESM
// ---------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------
// Load .env config
// ---------------------
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ---------------------
// Init Express app FIRST
// ---------------------
const app = express();

// ---------------------
// Middleware
// ---------------------
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------------------
// Routes
// ---------------------
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);

// ---------------------
// Connect DB & Start Server
// ---------------------
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
