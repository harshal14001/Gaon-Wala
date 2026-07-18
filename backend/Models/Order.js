import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  title:     { type: String, required: true },
  price:     { type: Number, required: true },
  image:     { type: String },
  qty:       { type: Number, required: true, min: 1 },
});

const customerSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  phone:   { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  customer:           { type: customerSchema, required: true },
  items:              { type: [orderItemSchema], required: true },
  total:              { type: Number, required: true },
  status:             { type: String, default: "Pending", enum: ["Pending", "Confirmed", "Delivered", "Cancelled"] },

  // Payment fields
  paymentMethod:      { type: String, enum: ["cash_on_delivery", "razorpay"], default: "cash_on_delivery" },
  paymentStatus:      { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  razorpayOrderId:    { type: String },          // Razorpay order ID
  razorpayPaymentId:  { type: String },          // Razorpay payment ID (after successful payment)
  razorpaySignature:  { type: String },          // Razorpay signature (for verification)

  createdBy:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'User'
  }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
