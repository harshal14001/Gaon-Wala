// seeder.mjs - Transfers hardcoded products into MongoDB (gaonwala)

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Product from "./backend/Models/Products.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, ".env");
console.log("🧪 Loading .env from:", envPath); // Debug line

dotenv.config({ path: envPath });

console.log("🔍 MONGO_URI =", process.env.MONGO_URI); // Debug line


const products = [
  { title: "Mango", price: 99, image: "", category: "Fruits" },
  { title: "Onion", price: 49, image: "", category: "Vegetable" },
  { title: "Organic Ghee", price: 349, image: "", category: "Milk Products" },
  { title: "Mango Plant", price: 399, image: "", category: "Plants" },
  { title: "Soyabean Seeds", price: 45, image: "", category: "Seeds" },
  { title: "Jamun Plant", price: 399, image: "", category: "Plants" },
  { title: "Chickoo Plant", price: 399, image: "", category: "Plants" },
  { title: "Corn", price: 99, image: "", category: "Seeds" },
  { title: "Maize", price: 99, image: "", category: "Seeds" },
  { title: "Wheat", price: 99, image: "", category: "Seeds" },
  { title: "Jowar", price: 99, image: "", category: "Seeds" },
  { title: "Lemon", price: 99, image: "", category: "Vegetables" },
  { title: "Jamun Plant", price: 99, image: "", category: "Plants" },
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await Product.deleteMany();
    const inserted = await Product.insertMany(products);
    console.log(`✅ Seeded ${inserted.length} products to MongoDB.`);
    process.exit();
  } catch (err) {
    console.error("❌ Seeder failed:", err.message);
    process.exit(1);
  }
};

seedProducts();
