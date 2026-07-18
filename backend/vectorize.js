// backend/vectorize.js
// ─────────────────────────────────────────────────────
// Run once to embed all products:       node vectorize.js
// Re-embed ALL products (force reset):  node vectorize.js --force
//
// Model: gemini-embedding-001 (3072 dimensions)
// Atlas vector index must use numDimensions: 3072
// ─────────────────────────────────────────────────────

import 'dotenv/config';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Product from './Models/Products.js';

const FORCE = process.argv.includes('--force');

const genAI          = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

await mongoose.connect(process.env.MONGO_URI);
console.log("☁️  Connected to MongoDB");

// ── Rich semantic descriptions — no API call needed ────────────────────────
// LLM already knows this. We just hardcode it so vectorize never fails.
// The richer this text, the better the semantic search.
const DESCRIPTIONS = {
    // Spices & Heat
    "ginger":           "Ginger is a spicy, pungent, hot root used in Indian cooking, teas, and medicine. It adds sharp heat and warmth to dishes and drinks. Known for its fiery, strong flavour.",
    "tamarind":         "Tamarind is a sour, tangy, acidic fruit used in Indian chutneys, curries, and drinks. It has a distinctive sweet-sour taste and is commonly used in sambar and rasam.",

    // Sweet Fruits
    "mango":            "Mango is a sweet, juicy tropical fruit. It is rich, sugary, and delicious. Used in desserts, smoothies, juices, pickles, and eaten fresh. One of India's most loved fruits.",
    "papaya":           "Papaya is a sweet, soft orange tropical fruit. It is mildly sweet and used fresh, in salads, smoothies, and for digestive health.",
    "guava":            "Guava is a sweet-sour tropical fruit eaten fresh. It has a distinctive aroma, is rich in vitamins, and has a slightly grainy texture.",
    "jamun":            "Jamun is a dark purple summer fruit with a sweet-sour, astringent taste. It is juicy and known for its health benefits especially for blood sugar.",
    "dragon fruit":     "Dragon fruit is a mildly sweet, refreshing tropical fruit with a vibrant pink exterior. It is light, sweet, and nutritious.",
    "chickoo":          "Chickoo (Sapodilla) is a sweet, brown fruit with a soft, grainy texture. It tastes like brown sugar with notes of pear and vanilla.",

    // Sour & Tangy
    "lemon":            "Lemon is a sour, tangy, acidic citrus fruit. It is used for juices, marinades, dressings, and to add a sharp tangy flavour to food and drinks.",

    // Vegetables
    "onion":            "Onion is a sharp, pungent, savoury vegetable used as the base of most Indian cooking. Can be eaten raw, caramelised, or cooked. Has a strong aroma.",
    "cabbage":          "Cabbage is a leafy green vegetable that is crunchy and mild. Used in salads, stir-fries, and sabzis. It is a leafy, green, fibrous vegetable.",
    "cucumber":         "Cucumber is a cool, refreshing, mild vegetable with high water content. Slightly sweet and crisp. Used in salads, raita, and as a snack.",
    "corn":             "Corn is a sweet, starchy grain eaten roasted, boiled, or in curries. It has a naturally sweet and savoury flavour. Also known as maize.",

    // Grains & Seeds
    "wheat":            "Wheat is a staple grain used for making flour, roti, chapati, and bread. It is a primary food grain consumed daily across India.",
    "jowar":            "Jowar is a nutritious millet grain used in traditional Indian flatbreads, porridge, and bhakri. It is gluten-free, earthy, and a healthy grain alternative.",
    "raw maize":        "Raw Maize is unprocessed corn grain used for making cornmeal, flour, and as animal feed. It is starchy, sweet, and a versatile grain.",
    "soyabean seeds":   "Soyabean seeds are protein-rich legume seeds used in cooking, oil production, and as a nutritious food source. High in protein and healthy fats.",

    // Dairy
    "organic ghee":     "Organic Ghee is pure clarified butter made from cow's milk. It has a rich, nutty, aromatic flavour. Used extensively in Indian cooking and Ayurvedic medicine.",

    // Medicinal & Other
    "aloevera":         "Aloe Vera is a succulent medicinal plant known for its cooling gel. Used for skincare, hair care, digestive health, and as a health drink. Bitter in taste.",

    // Plants (Trees)
    "mango plant":      "Mango plant is a fruit-bearing tree that grows sweet, juicy mangoes. A tropical tree cultivated widely across India for its delicious fruit.",
    "jamun plant":      "Jamun plant is a fruit tree that bears jamun berries — dark purple, sweet-sour summer fruits known for their health benefits.",
    "chickoo plant":    "Chickoo plant (Sapodilla tree) grows chickoo fruit, a sweet brown fruit with a grainy texture and caramel-like flavour.",
};

// ── Get description — lookup first, then smart fallback ───────────────────
const getDescription = (title, category) => {
    // Try exact match (lowercase)
    const key = title.toLowerCase().trim();
    if (DESCRIPTIONS[key]) return DESCRIPTIONS[key];

    // Try partial match — handles slight title variations
    for (const [k, v] of Object.entries(DESCRIPTIONS)) {
        if (key.includes(k) || k.includes(key)) return v;
    }

    // Smart category fallback — better than nothing
    const categoryFallbacks = {
        "fruit":     `${title} is a fresh farm fruit. It can be sweet, sour, or tangy.`,
        "vegetable": `${title} is a fresh farm vegetable used in cooking and salads.`,
        "grain":     `${title} is a nutritious grain or cereal used for cooking and flour.`,
        "seed":      `${title} is a farm seed used for planting or as a food ingredient.`,
        "dairy":     `${title} is a dairy product used in Indian cooking and nutrition.`,
        "medicinal": `${title} is a medicinal plant used for health and wellness.`,
        "spice":     `${title} is a spice or flavouring agent used in Indian cooking.`,
        "plant":     `${title} is a farm plant cultivated for its fruit or produce.`,
    };

    const cat = (category || "").toLowerCase();
    for (const [k, v] of Object.entries(categoryFallbacks)) {
        if (cat.includes(k)) return v;
    }

    return `${title} is a farm product in the ${category} category.`;
};

// ── Embed with retry ───────────────────────────────────────────────────────
const embedWithRetry = async (text, retries = 3, delayMs = 1000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const result = await embeddingModel.embedContent(text);
            return result.embedding.values;
        } catch (err) {
            const is503 = err?.status === 503 || err?.message?.includes("503");
            if (is503 && attempt < retries) {
                console.warn(`   ⚠️  Embedding 503 — retrying in ${delayMs}ms...`);
                await new Promise(res => setTimeout(res, delayMs));
                delayMs *= 2;
            } else throw err;
        }
    }
};

// ── Process each product ───────────────────────────────────────────────────
const query    = FORCE ? {} : { embedding: { $exists: false } };
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
    console.log(`\n🔄 "${product.title}"`);
    try {
        const description = getDescription(product.title, product.category);
        const textToEmbed = `Product: ${product.title}. Category: ${product.category}. ${description}`;
        console.log(`   📄 ${textToEmbed}`);

        const embedding = await embedWithRetry(textToEmbed);

        if (embedding.length !== 3072) {
            console.warn(`   ⚠️  Unexpected dimensions: ${embedding.length}`);
        }

        await Product.updateOne({ _id: product._id }, { $set: { embedding } });
        console.log(`   ✅ Done [${embedding.length} dims]`);
        success++;

        await new Promise(res => setTimeout(res, 200));
    } catch (err) {
        console.error(`   ❌ Failed: ${err.message}`);
        failed++;
    }
}

console.log(`\n🎉 Done! ${success} embedded, ${failed} failed.`);
if (failed > 0) console.log("   Re-run to retry failed ones.");
await mongoose.disconnect();
