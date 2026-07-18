import express from 'express';
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from '../Controllers/productController.js';
import { protectAdminOrGuest } from '../Middlewares/authMiddleware.js';

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

// Public — anyone can view products (main page)
router.get('/', getProducts);

// Protected — real admin writes to DB, guest writes to sandbox
router.post('/', protectAdminOrGuest, upload.single('image'), addProduct);
router.put('/:id', protectAdminOrGuest, upload.single('image'), updateProduct);
router.delete('/:id', protectAdminOrGuest, deleteProduct);

export default router;
