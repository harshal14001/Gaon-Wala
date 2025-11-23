import express from 'express';
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../Models/Products.js";
import {
  getProducts,
  addProduct,
  updateProduct, // ✅ Imported only once here
  deleteProduct,
} from '../Controllers/productController.js';
import { protectAdmin } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// Setup __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer Storage Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads")); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + file.originalname;
    cb(null, uniqueSuffix);
  }
});

const upload = multer({ storage });

// Routes
router.get('/', getProducts);

// Add Product (POST)
router.post('/', protectAdmin, upload.single('image'), addProduct);

// Update Product (PUT) -
router.put('/:id', protectAdmin, upload.single('image'), updateProduct);

// Delete Product (DELETE)
router.delete('/:id', protectAdmin, deleteProduct);

export default router;