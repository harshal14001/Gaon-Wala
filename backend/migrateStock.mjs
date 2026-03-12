// migrateStock.mjs
// Run once: node migrateStock.mjs
// Sets stock = 50 on every product that doesn't already have a stock field.

import "dotenv/config";
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env");
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
console.log("✅ Connected to MongoDB");

const result = await mongoose.connection.collection("products").updateMany(
  { stock: { $exists: false } },   // only products that have no stock field yet
  { $set: { stock: 50 } }
);

console.log(`✅ Migration complete. Updated ${result.modifiedCount} product(s) → stock set to 50.`);
await mongoose.disconnect();
