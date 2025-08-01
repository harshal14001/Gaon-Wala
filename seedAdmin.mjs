// seedAdmin.mjs
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Admin from "./backend/Models/Admin.js"; // adjust if needed

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const exists = await Admin.findOne({ email: "admin@example.com" });
    if (exists) {
      console.log("✅ Admin already exists.");
      process.exit();
    }

    const admin = new Admin({
      email: "admin@example.com",
      password: "gaonwala@123", // this will be hashed
    });

    await admin.save();
    console.log("✅ Admin seeded successfully.");
    process.exit();
  } catch (err) {
    console.error("❌ Seeding admin failed:", err.message);
    process.exit(1);
  }
};

seedAdmin();
