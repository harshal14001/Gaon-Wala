import express from 'express';
import { loginAdmin, } from '../Controllers/adminController.js';
import { protectAdmin } from '../Middlewares/authMiddleware.js';
import { addProduct } from '../Controllers/productController.js';

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/add', protectAdmin, addProduct);
export default router;
