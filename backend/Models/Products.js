import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title:     { type: String,   required: true },
  price:     { type: Number,   required: true },
  image:     { type: String },
  category:  { type: String,   required: true },
  stock:     { type: Number,   required: true, default: 50, min: 0 },

  createdBy:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'Admin'
  },

  // Vector embedding field — populated by vectorize.js, searched by aiRoutes.js
  embedding: { type: [Number], default: undefined, select: false },
  // select: false → never returned in normal .find() queries, saves bandwidth

},{timestamps:true});

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;
