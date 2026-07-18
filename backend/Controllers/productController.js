import Products from "../Models/Products.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
import { getSession } from "../utils/sandboxStore.js";

if (!process.env.GEMINI_API_KEY) {
  console.error("⚠️  GEMINI_API_KEY not configured - embedding features will fail");
}

// ── Embedding helper (real admin only) ────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

const generateEmbedding = async (product) => {
  const text = `Product: ${product.title}. Category: ${product.category}. Price: ₹${product.price}.`;
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
};

// ── Helper: is this a guest request? ─────────────────────────────────────────
const isGuest = (req) => req.user?.role === 'guest';

// ── GET all products ──────────────────────────────────────────────────────────
export const getProducts = async (req, res) => {
  try {
    // Guest → return their sandbox copy
    if (isGuest(req)) {
      const session = getSession(req.user.sessionId);
      if (!session) return res.status(403).json({ message: "Guest session expired. Please log in again." });
      return res.json(session.products);
    }

    // Real admin / public → return from DB
    const products = await Products.find();
    res.json(products);
  } catch (err) {
    console.error("Fetch failed:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// ── POST — Add product ────────────────────────────────────────────────────────
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

    // ── Guest path: add to sandbox only ──────────────────────────────────────
    if (isGuest(req)) {
      const session = getSession(req.user.sessionId);
      if (!session) return res.status(403).json({ message: "Guest session expired. Please log in again." });

      const guestProduct = {
        _id: crypto.randomUUID(),
        title,
        price: numPrice,
        category,
        image: imagePath,
        stock: numStock,
        isGuestAdded: true, // flag so frontend can badge it
      };
      session.products.push(guestProduct);
      return res.status(201).json(guestProduct);
    }

    // ── Real admin path: persist to DB + embed ────────────────────────────────
    const newProduct = await Products.create({
      title,
      price: numPrice,
      category,
      image: imagePath,
      stock: numStock,
    });

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

// ── PUT — Update product ──────────────────────────────────────────────────────
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { title, price, category, stock } = req.body;

  try {
    // ── Guest path: update in sandbox only ───────────────────────────────────
    if (isGuest(req)) {
      const session = getSession(req.user.sessionId);
      if (!session) return res.status(403).json({ message: "Guest session expired. Please log in again." });

      const idx = session.products.findIndex((p) => p._id?.toString() === id);
      if (idx === -1) return res.status(404).json({ message: "Product not found in sandbox" });

      const existing = session.products[idx];

      let imagePath = existing.image;
      if (req.file) {
        imagePath = `${process.env.BASE_URL || "http://localhost:5000"}/uploads/${req.file.filename}`;
      } else if (req.body.image) {
        imagePath = req.body.image;
      }

      const numPrice = price !== undefined ? Number(price) : existing.price;
      const numStock = stock !== undefined ? Number(stock) : existing.stock;

      if (price !== undefined && (isNaN(numPrice) || numPrice <= 0)) {
        return res.status(400).json({ message: "Price must be a positive number" });
      }
      if (stock !== undefined && (isNaN(numStock) || numStock < 0)) {
        return res.status(400).json({ message: "Stock cannot be negative" });
      }

      const updatedProduct = {
        ...existing,
        title: title ?? existing.title,
        price: numPrice,
        category: category ?? existing.category,
        stock: numStock,
        image: imagePath,
      };

      session.products[idx] = updatedProduct;
      return res.json(updatedProduct);
    }

    // ── Real admin path: update in DB + re-embed ──────────────────────────────
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

// ── DELETE — Delete product ───────────────────────────────────────────────────
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    // ── Guest path: remove from sandbox only ─────────────────────────────────
    if (isGuest(req)) {
      const session = getSession(req.user.sessionId);
      if (!session) return res.status(403).json({ message: "Guest session expired. Please log in again." });

      const before = session.products.length;
      session.products = session.products.filter((p) => p._id?.toString() !== id);

      if (session.products.length === before) {
        return res.status(404).json({ message: "Product not found in sandbox" });
      }
      return res.json({ message: "Product deleted from sandbox" });
    }

    // ── Real admin path: delete from DB ──────────────────────────────────────
    await Products.findByIdAndDelete(id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
