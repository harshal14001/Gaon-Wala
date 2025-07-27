import express from "express";
import cors from "cors";
import productRoutes from "./Routes/productRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON payloads

// Routes
app.use("/api/products", productRoutes);

// Export the configured app
export default app;
