import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  price:    { type: Number, required: true },
  image:    { type: String },
  category: { type: String, required: true },
  stock:    { type: Number, required: true, default: 50, min: 0 },
});

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;
