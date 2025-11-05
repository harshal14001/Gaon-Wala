
// Updated: AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const AdminDashboard = ({ onLogout }) => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ title: "", price: "", image: null, category: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await axios.get("http://localhost:5000/api/products", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching products", err);
      }
    };
    fetchProducts();
  }, []);

  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    setForm({ ...form, [name]: files ? files[0] : value });
  };

  const handleInlineChange = (id, e) => {
    const { name, value, files } = e.target;
    setProducts((prev) =>
      prev.map((p) =>
        p._id === id
          ? {
            ...p,
            editForm: { ...p.editForm, [name]: files ? files[0] : value },
          }
          : p
      )
    );
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.category || isNaN(form.price)) return alert("Fill valid inputs");
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => v && formData.append(k, v));
      const res = await axios.post("http://localhost:5000/api/products", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      setProducts([...products, res.data]);
      setForm({ title: "", price: "", image: null, category: "" });
    } catch (err) {
      console.error("Add failed", err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setProducts((prev) =>
      prev.map((p) =>
        p._id === product._id
          ? {
            ...p,
            isEditing: true,
            editForm: {
              title: product.title,
              price: product.price,
              image: null,
              category: product.category,
            },
          }
          : { ...p, isEditing: false }
      )
    );
  };

  const handleUpdate = async (e, product) => {
    e.preventDefault();
    const data = product.editForm;
    if (!data.title || !data.price || !data.category || isNaN(data.price)) return alert("Invalid edit fields");
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const payload = new FormData();
      Object.entries(data).forEach(([k, v]) => v && payload.append(k, v));
      const res = await axios.put(`http://localhost:5000/api/products/${product._id}`, payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...res.data, isEditing: false } : p))
      );
    } catch (err) {
      console.error("Update failed", err);
      setError("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = (id) => {
    setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, isEditing: false } : p)));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Confirm delete?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(products.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </div>

      <form className="product-form" onSubmit={handleAdd}>
        <input name="title" placeholder="Title" value={form.title} onChange={handleFormChange} required />
        <input name="price" type="number" placeholder="Price ₹" value={form.price} onChange={handleFormChange} required />
        <input name="image" type="text"   placeholder="Paste Cloudinary image URL" value={form.image} onChange={handleFormChange}/>
        <input name="category" placeholder="Category" value={form.category} onChange={handleFormChange} required />
        <button type="submit" className="add-btn" disabled={loading}>{loading ? "Adding..." : "Add Product"}</button>
        {error && <p className="form-error">{error}</p>}
      </form>

      <div className="product-list">
        <h3>All Products</h3>
        {products.map((product) => (
          <div key={product._id} className="product-item">
            <img src={product.image} alt={product.title} />
            <div className="product-details">
              <h4>{product.title}</h4>
              <p>₹{product.price}</p>
              <p>{product.category}</p>
            </div>
            <div className="product-actions">
              <button onClick={() => handleEdit(product)} className="edit-btn">Edit</button>
              <button onClick={() => handleDelete(product._id)} className="delete-btn">Delete</button>
            </div>

            {product.isEditing && (
              <form className="edit-form" onSubmit={(e) => handleUpdate(e, product)}>
                <input name="title" value={product.editForm.title} onChange={(e) => handleInlineChange(product._id, e)} required />
                <input name="price" type="number" value={product.editForm.price} onChange={(e) => handleInlineChange(product._id, e)} required />
                <input name="image" type="file" accept="image/*" onChange={(e) => handleInlineChange(product._id, e)} />
                <input name="category" value={product.editForm.category} onChange={(e) => handleInlineChange(product._id, e)} required />
                <div className="edit-buttons">
                  <button type="submit" className="add-btn" disabled={loading}>{loading ? "Saving..." : "Update"}</button>
                  <button type="button" className="delete-btn" onClick={() => handleCancelEdit(product._id)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
