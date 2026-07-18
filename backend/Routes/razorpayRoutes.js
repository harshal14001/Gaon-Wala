import express from "express";
import { createRazorpayOrder, verifyPaymentAndPlaceOrder, handlePaymentFailure } from "../Controllers/razorpayController.js";

const router = express.Router();

// Create Razorpay order (before payment)
router.post("/create-order", createRazorpayOrder);

// Verify payment signature and place order (after successful payment)
router.post("/verify-payment", verifyPaymentAndPlaceOrder);

// Handle failed payments (optional)
router.post("/payment-failed", handlePaymentFailure);

export default router;
