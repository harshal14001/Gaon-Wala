import Products from "../Models/Products.js";


// GET all products
export const getProducts = async (req, res) => {
  try {
    const products = await Products.find();
    if (!Array.isArray(products)) {
      return res.status(500).json({ message: "Products not an array" });
    }
    res.json(products);
  } catch (err) {
    console.error("Fetch failed:", err);
    res.status(500).json({ message: "failed to fetch products" });
  }
};



// POST - send - create product (for adding from backend if needed)

export const addProduct = async (req, res) => {
  console.log("Uploaded File:", req.file); 
  try {
    console.log("Form Data:", req.body);
    console.log("Uploaded File:", req.file);

    const { title, price, category } = req.body;

    if (!title || !price || !category) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const image = req.file?.filename || null;

    const newProduct = await Product.create({
      title,
      price,
      category,
      image,
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error("Product upload error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};




//PATCH - Update a product
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { title, price, image, category } = req.body;
  try {
    const updated = await Products.findByIdAndUpdate(
      id,
      { title, price, image, category },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//  DELETE - Delete a product
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await Products.findByIdAndDelete(id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
