import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const STATUS_OPTIONS = ["Pending", "Confirmed", "Delivered", "Cancelled"];

const AdminDashboard = ({ onLogout }) => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ title: "", price: "", image: "", category: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [view, setView] = useState("products");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (!token) { onLogout(); return; }
        const res = await axios.get("http://localhost:5000/api/products", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) onLogout();
      }
    };
    fetchProducts();
  }, [onLogout, token]);

  useEffect(() => {
    if (view !== "orders") return;
    const fetchOrders = async () => {
      setOrdersLoading(true);
      setOrdersError("");
      try {
        const res = await axios.get("http://localhost:5000/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data);
      } catch {
        setOrdersError("Failed to load orders.");
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [view, token]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await axios.patch(
        `http://localhost:5000/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: res.data.status } : o))
      );
    } catch {
      alert("Failed to update status.");
    }
  };

  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    setForm({ ...form, [name]: files ? files[0] : value });
  };

  const handleInlineChange = (id, e) => {
    const { name, value, files } = e.target;
    setProducts((prev) =>
      prev.map((p) =>
        p._id === id
          ? { ...p, editForm: { ...p.editForm, [name]: files ? files[0] : value } }
          : p
      )
    );
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.category || isNaN(form.price))
      return alert("Fill valid inputs");
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => v && formData.append(k, v));
      const res = await axios.post("http://localhost:5000/api/products", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts([...products, res.data]);
      setForm({ title: "", price: "", image: "", category: "" });
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setProducts((prev) =>
      prev.map((p) =>
        p._id === product._id
          ? { ...p, isEditing: true, editForm: { title: product.title, price: product.price, image: product.image, category: product.category } }
          : { ...p, isEditing: false }
      )
    );
  };

  const handleUpdate = async (e, product) => {
    e.preventDefault();
    const data = product.editForm;
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("title", data.title);
      payload.append("price", data.price);
      payload.append("category", data.category);
      if (data.image) payload.append("image", data.image);
      const res = await axios.put(`http://localhost:5000/api/products/${product._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...res.data, isEditing: false } : p))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
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
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(products.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const statusClass = (status) => ({
    Pending:   "status-pending",
    Confirmed: "status-confirmed",
    Delivered: "status-delivered",
    Cancelled: "status-cancelled",
  }[status] || "");

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <div className="admin-header-actions">
          <button
            className={`view-orders-btn ${view === "orders" ? "active" : ""}`}
            onClick={() => setView(view === "orders" ? "products" : "orders")}
          >
            {view === "orders" ? "← Products" : "View Orders 📦"}
          </button>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      {/* ── ORDERS PANEL ── */}
      {view === "orders" && (
        <div className="orders-panel">
          <h3>All Orders</h3>
          {ordersLoading && <p className="orders-loading">Loading orders...</p>}
          {ordersError && <p className="orders-error">{ordersError}</p>}
          {!ordersLoading && !ordersError && orders.length === 0 && (
            <p className="no-orders">No orders yet.</p>
          )}

          {orders.map((order) => (
            <div key={order._id} className="order-card">

              {/* Top row: order meta + status */}
              <div className="order-card-header">
                <div className="order-meta">
                  <span className="order-id">Order #{order._id.slice(-6).toUpperCase()}</span>
                  <span className="order-date">
                    {new Date(order.createdAt).toLocaleString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="order-card-right">
                  <span className={`status-badge ${statusClass(order.status)}`}>
                    {order.status}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className="status-select"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer info block */}
              {order.customer && (
                <div className="customer-info-block">
                  <div className="customer-info-row">
                    <span className="customer-info-icon">👤</span>
                    <span className="customer-info-value">{order.customer.name}</span>
                  </div>
                  <div className="customer-info-row">
                    <span className="customer-info-icon">📞</span>
                    <a href={`tel:${order.customer.phone}`} className="customer-phone">
                      {order.customer.phone}
                    </a>
                  </div>
                  <div className="customer-info-row">
                    <span className="customer-info-icon">📍</span>
                    <span className="customer-info-value">{order.customer.address}</span>
                  </div>
                </div>
              )}

              {/* Order items */}
              <div className="order-items">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item-row">
                    <img src={item.image} alt={item.title} className="order-item-img" />
                    <span className="order-item-title">{item.title}</span>
                    <span className="order-item-qty">× {item.qty}</span>
                    <span className="order-item-price">₹{(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="order-total">
                Total: <strong>₹{order.total.toFixed(2)}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PRODUCTS PANEL ── */}
      {view === "products" && (
        <>
          <form className="product-form" onSubmit={handleAdd}>
            <input name="title" placeholder="Title" value={form.title || ""} onChange={handleFormChange} required />
            <input name="price" type="number" placeholder="Price ₹" value={form.price || ""} onChange={handleFormChange} required />
            <input name="image" type="text" placeholder="Paste Cloudinary image URL" value={form.image || ""} onChange={handleFormChange} />
            <select name="category" value={form.category || ""} onChange={handleFormChange} required className="category-select"
              style={{ padding: "10px", margin: "5px", borderRadius: "5px", border: "1px solid #ccc" }}>
              <option value="">Select Category</option>
              <option value="Vegetable">Vegetable</option>
              <option value="Fruit">Fruit</option>
              <option value="Milk Products">Milk Products</option>
              <option value="Plants">Plants</option>
              <option value="Seeds">Seeds</option>
            </select>
            <button type="submit" className="add-btn" disabled={loading}>{loading ? "Adding..." : "Add Product"}</button>
            {error && <p className="form-error">{error}</p>}
          </form>

          <div className="product-list">
            <h3>All Products</h3>
            {products.map((product) => (
              <div key={product._id} className="product-item">
                {!product.isEditing ? (
                  <>
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
                  </>
                ) : (
                  <form className="edit-form" onSubmit={(e) => handleUpdate(e, product)}>
                    <input name="title" value={product.editForm.title} onChange={(e) => handleInlineChange(product._id, e)} required />
                    <input name="price" type="number" value={product.editForm.price} onChange={(e) => handleInlineChange(product._id, e)} required />
                    <input name="image" type="text" placeholder="Paste Image URL" value={product.editForm.image || ""} onChange={(e) => handleInlineChange(product._id, e)} />
                    <select name="category" value={product.editForm.category} onChange={(e) => handleInlineChange(product._id, e)} required style={{ padding: "5px", borderRadius: "5px" }}>
                      <option value="">Select Category</option>
                      <option value="Vegetable">Vegetable</option>
                      <option value="Fruit">Fruit</option>
                      <option value="Milk Products">Milk Products</option>
                      <option value="Plants">Plants</option>
                      <option value="Seeds">Seeds</option>
                    </select>
                    <div className="edit-buttons">
                      <button type="submit" className="add-btn" disabled={loading}>{loading ? "Saving..." : "Update"}</button>
                      <button type="button" className="delete-btn" onClick={() => handleCancelEdit(product._id)}>Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
