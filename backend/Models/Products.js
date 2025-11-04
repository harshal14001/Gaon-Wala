import mongoose from "mongoose";
import { type } from "os";

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  category: { type: String, required: true }, 
   
});

const Products = mongoose.model("Product", productSchema);
export default Products;
