import Products from "../Models/Products.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  console.error("⚠️  GEMINI_API_KEY not configured - embedding features will fail");
}

// ── Embedding helper ───────────────────────────────────────────────────────
// gemini-embedding-001 outputs 3072-dimensional vectors
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

const generateEmbedding = async (product) => {
  const text = `Product: ${product.title}. Category: ${product.category}. Price: ₹${product.price}.`;
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values; // 3072 numbers 
};

// GET all products
export const getProducts = async (req, res) => {
  try {
    const products = await Products.find();
    res.json(products);
  } catch (err) {
    console.error("Fetch failed:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// POST — Add product
export const addProduct = async (req, res) => {
  try {
    const { title, price, category, stock } = req.body;

    if (!title || !price || !category) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ message: "Price must be a positive number" });
    }

    const numStock = stock !== undefined ? Number(stock) : 50;
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ message: "Stock cannot be negative" });
    }

    let imagePath = "";
    if (req.file) {
      imagePath = `${process.env.BASE_URL || "http://localhost:5000"}/uploads/${req.file.filename}`;
    } else if (req.body.image) {
      imagePath = req.body.image;
    }

    const newProduct = await Products.create({
      title,
      price: numPrice,
      category,
      image: imagePath,
      stock: numStock,
    });

    // ✅ Auto-embed after creation so it's immediately searchable via vector search
    // Non-blocking — product is created even if embedding fails
    try {
      const embedding = await generateEmbedding(newProduct);
      await Products.updateOne({ _id: newProduct._id }, { $set: { embedding } });
      console.log(`✅ Auto-embedded: ${newProduct.title}`);
    } catch (embedErr) {
      console.error(`⚠️ Embedding failed for "${newProduct.title}" (run vectorize.js manually):`, embedErr.message);
    }

    res.status(201).json(newProduct);
  } catch (err) {
    console.error("Product upload error:", err);
    res.status(500).json({ message: "Something went wrong on the server" });
  }
};

// PUT — Update product
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { title, price, category, stock } = req.body;

  try {
    let updateData = { title, price, category };

    if (stock !== undefined) {
      const numStock = Number(stock);
      if (isNaN(numStock) || numStock < 0) {
        return res.status(400).json({ message: "Stock cannot be negative" });
      }
      updateData.stock = numStock;
    }

    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice <= 0) {
        return res.status(400).json({ message: "Price must be a positive number" });
      }
      updateData.price = numPrice;
    }

    if (req.file) {
      updateData.image = `${process.env.BASE_URL || "http://localhost:5000"}/uploads/${req.file.filename}`;
    } else if (req.body.image) {
      updateData.image = req.body.image;
    }

    const updated = await Products.findByIdAndUpdate(id, updateData, { new: true });

    // ✅ Re-embed on update — title/category/price change affects semantic meaning
    try {
      const embedding = await generateEmbedding(updated);
      await Products.updateOne({ _id: updated._id }, { $set: { embedding } });
      console.log(`✅ Re-embedded: ${updated.title}`);
    } catch (embedErr) {
      console.error(`⚠️ Re-embedding failed for "${updated.title}":`, embedErr.message);
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE — Delete product
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await Products.findByIdAndDelete(id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
