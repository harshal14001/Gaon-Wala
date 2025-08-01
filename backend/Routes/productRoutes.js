import express from 'express';
import multer from 'multer';
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from '../Controllers/productController.js';
import { protectAdmin } from '../Middlewares/authMiddleware.js';

const router = express.Router(); // ✅ MUST BE BEFORE usage

const upload = multer({ dest: 'uploads/' }); // ✅ okay here

router.get('/', getProducts);
router.post('/', protectAdmin, upload.single('image'), addProduct);
router.put('/:id', protectAdmin, updateProduct);
router.delete('/:id', protectAdmin, deleteProduct);

export default router;
