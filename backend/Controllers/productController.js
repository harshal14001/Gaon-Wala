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
  try {
    // Multer processes the file first, then populates req.body
    const { title, price, category } = req.body;

    console.log("Body received:", req.body); // Debugging
    console.log("File received:", req.file); // Debugging

    if (!title || !price || !category) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // FIX: LOGIC TO HANDLE BOTH FILE UPLOAD OR PASTED URL
    let imagePath = "";

    if (req.file) {
      // Case 1: Admin uploaded a file from computer
      imagePath = `http://localhost:5000/uploads/${req.file.filename}`;
    } else if (req.body.image) {
      // Case 2: Admin pasted a Cloudinary/External URL string
      imagePath = req.body.image;
    }

    const newProduct = await Products.create({
      title,
      price,
      category,
      image: imagePath,
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error("Product upload error:", err);
    res.status(500).json({ message: "Something went wrong on the server" });
  }
};


//PATCH - Update a product

// Controllers/productController.js

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { title, price, category } = req.body;

  try {
    let updateData = {
      title,
      price,
      category
    };

    // LOGIC: Check for File first, then Check for Text URL
    if (req.file) {
      // 1. New File Uploaded
      updateData.image = `http://localhost:5000/uploads/${req.file.filename}`;
    } else if (req.body.image) {
      // 2. Text URL provided (Cloudinary or kept existing)
      updateData.image = req.body.image;
    }

    const updated = await Products.findByIdAndUpdate(
      id,
      updateData,
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
