// EditProductModal.jsx
import React, { useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const EditProductModal = ({ product, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    title: product.title || "",
    price: product.price || "",
    category: product.category || "",
    image: product.image || "", // This stores the Text URL
  });
  
  const [selectedFile, setSelectedFile] = useState(null); // Separate state for file
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle Text Inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle File Input Separately
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem("adminToken");
      const formData = new FormData();
      
      formData.append("title", form.title);
      formData.append("price", form.price);
      formData.append("category", form.category);

      // LOGIC: Prefer File over URL if both are present
      if (selectedFile) {
        // User selected a new file from computer
        formData.append("image", selectedFile);
      } else if (form.image) {
        // User pasted a URL (or kept the old one)
        formData.append("image", form.image);
      }

      const res = await axios.put(`http://localhost:5000/api/products/${product._id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // Axios handles Content-Type automatically
        },
      });

      onUpdated(res.data);
      onClose();
    } catch (err) {
      console.error("Update failed", err);
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-inline-wrapper">
      <div className="edit-inline-box">
        <h3>Edit Product</h3>
        <form onSubmit={handleSubmit}>
          <label>Product Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />

          <label>Price (₹)</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            required
          />

          <label>Image URL (Cloudinary/External)</label>
          <input
            type="text"
            name="image"
            value={form.image}
            onChange={handleChange}
            placeholder="https://..."
          />

          <label>OR Upload New File</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />

          <label>Category</label>
          <input
            type="text"
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          />

          <div className="modal-btn-group">
            <button type="submit" className="add-btn" disabled={loading}>
              {loading ? "Updating..." : "Update"}
            </button>
            <button type="button" className="delete-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
          {error && <p className="form-error">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;