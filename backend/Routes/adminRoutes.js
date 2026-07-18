import express from 'express';
import { loginAdmin, guestLogin } from '../Controllers/adminController.js';
import { protectAdmin } from '../Middlewares/authMiddleware.js';
import { addProduct } from '../Controllers/productController.js';

const router = express.Router();

// Real admin login
router.post('/login', loginAdmin);

// Guest admin login — no credentials needed, issues a sandbox-scoped JWT
router.post('/guest-login', guestLogin);

router.post('/add', protectAdmin, addProduct);

export default router;
