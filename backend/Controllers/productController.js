import Products from "../Models/Products.js";

// GET all products
export const getProducts = async (req, res) => {
  try {
    const products = await Products.find();
    res.json(products);
  } catch (err) {
    console.error("Fetch failed:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// POST — Add product
export const addProduct = async (req, res) => {
  try {
    const { title, price, category, stock } = req.body;

    if (!title || !price || !category) {
      return res.status(400).json({ message: "Missing fields" });
    }

    let imagePath = "";
    if (req.file) {
      imagePath = `${process.env.BASE_URL || "http://localhost:5000"}/uploads/${req.file.filename}`;
    } else if (req.body.image) {
      imagePath = req.body.image;
    }

    const newProduct = await Products.create({
      title,
      price,
      category,
      image: imagePath,
      stock: stock !== undefined ? Number(stock) : 50,
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error("Product upload error:", err);
    res.status(500).json({ message: "Something went wrong on the server" });
  }
};

// PUT — Update product
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { title, price, category, stock } = req.body;

  try {
    let updateData = { title, price, category };

    if (stock !== undefined) {
      updateData.stock = Number(stock);
    }

    if (req.file) {
      updateData.image = `${process.env.BASE_URL || "http://localhost:5000"}/uploads/${req.file.filename}`;
    } else if (req.body.image) {
      updateData.image = req.body.image;
    }

    const updated = await Products.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE — Delete product
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await Products.findByIdAndDelete(id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
