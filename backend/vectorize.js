// backend/vectorize.js
// ─────────────────────────────────────────────────────
// Run once to embed all products:       node vectorize.js
// Re-embed ALL products (force reset):  node vectorize.js --force
// Re-run anytime after adding products: node vectorize.js
//
// Model: gemini-embedding-001
// Output dimensions: 3072  ← Atlas index must use numDimensions: 3072
// ─────────────────────────────────────────────────────

import 'dotenv/config';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Product from './Models/Products.js';

const FORCE = process.argv.includes('--force');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// gemini-embedding-001 → 3072-dimensional vectors
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

await mongoose.connect(process.env.MONGO_URI);
console.log("☁️  Connected to MongoDB");

// --force: re-embed everything. Normal: only missing ones.
const query = FORCE ? {} : { embedding: { $exists: false } };
const products = await Product.find(query);

console.log(FORCE
    ? `⚡ Force mode — re-embedding all ${products.length} product(s)...`
    : `Found ${products.length} product(s) without embeddings...`
);

if (products.length === 0) {
    console.log("✅ All products already have embeddings. Run with --force to re-embed all.");
    await mongoose.disconnect();
    process.exit(0);
}

let success = 0;
let failed  = 0;

for (const product of products) {
    // Richer text = better semantic search results
    const textToEmbed = `Product: ${product.title}. Category: ${product.category}. Price: ₹${product.price}.`;

    try {
        const result = await embeddingModel.embedContent(textToEmbed);
        const embedding = result.embedding.values;

        // Sanity check — confirm we're getting 3072 dims
        if (embedding.length !== 3072) {
            console.warn(`⚠️  Unexpected dimension for "${product.title}": got ${embedding.length}, expected 3072`);
        }

        await Product.updateOne(
            { _id: product._id },
            { $set: { embedding } }
        );
        console.log(`✅ [${embedding.length} dims] Embedded: ${product.title}`);
        success++;
    } catch (err) {
        console.error(`❌ Failed for "${product.title}":`, err.message);
        failed++;
    }
}

console.log(`\n🎉 Done! ${success} embedded, ${failed} failed.`);
if (failed > 0) console.log("   Re-run the script to retry failed products.");
await mongoose.disconnect();
