import express from "express";
import { getProducts ,addProduct,updateProduct,deleteProduct } from "../Controllers/productController.js";
const router = express.Router();

// GET/api/products
router.get("/", getProducts);
// POST/api/products
router.post("/", addProduct);
//put
router.put("/:id", updateProduct);
//DELETE
router.delete("/:id", deleteProduct);





export default router;