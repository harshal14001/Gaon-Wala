import express from "express";
import { placeOrder, getOrders, updateOrderStatus } from "../Controllers/orderController.js";
import { protectAdmin } from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", placeOrder);                                    // Public  — customer places order
router.get("/", protectAdmin, getOrders);                        // Admin   — view all orders
router.patch("/:id/status", protectAdmin, updateOrderStatus);    // Admin   — update order status

export default router;
