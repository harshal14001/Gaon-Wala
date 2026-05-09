import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../Models/Order.js";
import Product from "../Models/Products.js";
import { sendOrderNotification } from "../utils/notificationService.js";

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── POST /api/razorpay/create-order ──────────────────────────────────────────
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, customer, items } = req.body;

    if (!amount || !customer || !items) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const options = {
      amount:   Math.round(amount * 100),
      currency: "INR",
      receipt:  `order_${Date.now()}`,
      notes: {
        customerName:  customer.name,
        customerPhone: customer.phone,
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      success:  true,
      orderId:  razorpayOrder.id,
      amount:   razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id:   process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    res.status(500).json({ message: "Failed to create payment order", error: err.message });
  }
};

// ── POST /api/razorpay/verify-payment ────────────────────────────────────────
export const verifyPaymentAndPlaceOrder = async (req, res) => {
  try {
    const {
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      customer, items, total,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    // ── Signature verification ─────────────────────────────────────────────
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed. Invalid signature." });
    }

    if (!customer?.name || !customer?.phone || !customer?.address) {
      return res.status(400).json({ message: "Customer details are required" });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // ── Stock validation ───────────────────────────────────────────────────
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product "${item.title}" not found.` });
      }
      if (product.stock < item.qty) {
        return res.status(400).json({
          message: `Sorry, only ${product.stock} unit(s) of "${product.title}" are left in stock.`,
        });
      }
    }

    // ── Deduct stock ───────────────────────────────────────────────────────
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.qty } });
    }

    // ── Create order ───────────────────────────────────────────────────────
    const order = await Order.create({
      customer,
      items,
      total,
      paymentMethod:     "razorpay",
      paymentStatus:     "completed",
      razorpayOrderId:   razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status:            "Confirmed",
    });

    // ── Notify customer — fire and forget, never blocks response ──────────
    sendOrderNotification("razorpay", customer, order);

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order,
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ message: "Failed to verify payment", error: err.message });
  }
};

// ── POST /api/razorpay/payment-failed ────────────────────────────────────────
export const handlePaymentFailure = async (req, res) => {
  try {
    const { razorpay_order_id, error_reason } = req.body;
    console.log(`Payment failed for order ${razorpay_order_id}: ${error_reason}`);
    res.json({ success: false, message: "Payment failed. Please try again." });
  } catch (err) {
    res.status(500).json({ message: "Error handling payment failure" });
  }
};
