import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config.js";
import "./AdminDashboard.css";

const STATUS_OPTIONS = ["Pending", "Confirmed", "Delivered", "Cancelled"];
const KNOWN_CATEGORIES = ["Vegetable", "Fruit", "Milk Products", "Plants", "Seeds"];

// ── Helper: format seconds as mm:ss ──────────────────────────────────────────
const formatCountdown = (seconds) => {
  if (seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// ── Sandbox Countdown Banner ──────────────────────────────────────────────────
const SandboxBanner = ({ onExpire }) => {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const expiry = Number(localStorage.getItem("guestTokenExpiry") || "0");
    return Math.max(0, Math.floor((expiry - Date.now()) / 1000));
  });

  useEffect(() => {
    if (secondsLeft <= 0) { onExpire(); return; }
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) { clearInterval(id); onExpire(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const urgent = secondsLeft < 5 * 60;
  return (
    <div className={`sandbox-banner ${urgent ? "sandbox-banner-urgent" : ""}`}>
      <span className="sandbox-icon">🧪</span>
      <div className="sandbox-text">
        <strong>Sandbox Mode</strong>
        <span>You're exploring as a Guest Admin. Changes are isolated to this session and won't affect the real database.</span>
      </div>
      <div className={`sandbox-timer ${urgent ? "sandbox-timer-urgent" : ""}`}>
        ⏱ {formatCountdown(secondsLeft)}
      </div>
    </div>
  );
};

// ── CategoryField ─────────────────────────────────────────────────────────────
// ROOT CAUSE OF BUG: previous version derived `showInput` purely from `value` prop.
// When "Other" was selected → onChange("") fired → value became "" →
// selectValue became "" → input condition was false → input vanished instantly.
//
// FIX: local `showCustom` state is set by the user's dropdown choice and persists
// independently of the value prop. It does NOT flip back to false when value="".
const CategoryField = ({ value, onChange, style = {} }) => {
  // On first render: if the incoming value is already a custom category, show input
  const [showCustom, setShowCustom] = useState(
    () => value !== "" && !KNOWN_CATEGORIES.includes(value)
  );

  const handleSelect = (e) => {
    const chosen = e.target.value;
    if (chosen === "Other") {
      setShowCustom(true);   // show the text input — stays visible even when value=""
      onChange("");           // clear so user types a fresh name
    } else {
      setShowCustom(false);
      onChange(chosen);
    }
  };

  // What the <select> shows:
  //  - known category  → that value
  //  - custom mode     → "Other" (keeps dropdown in sync)
  //  - nothing chosen  → ""
  const selectValue = showCustom
    ? "Other"
    : (KNOWN_CATEGORIES.includes(value) ? value : "");

  return (
    <div className="category-field-wrap" style={style}>
      <select
        value={selectValue}
        onChange={handleSelect}
        required={!showCustom}   // text input carries `required` when visible
        className="category-select"
      >
        <option value="">Select Category</option>
        {KNOWN_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        <option value="Other">Other (specify below)</option>
      </select>

      {showCustom && (
        <input
          type="text"
          className="category-custom-input"
          placeholder="e.g. Seasonal, Herbal, Exotic…"
          value={value}                              // controlled: shows what admin typed
          onChange={(e) => onChange(e.target.value)}
          required
          autoFocus
        />
      )}
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const AdminDashboard = ({ onLogout, isGuest }) => {
  const [products, setProducts]           = useState([]);
  const [form, setForm]                   = useState({ title: "", price: "", image: "", category: "", stock: "50" });
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [productSearch, setProductSearch] = useState("");

  const [view, setView]                   = useState("products");
  const [orders, setOrders]               = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError]     = useState("");

  const token = isGuest
    ? localStorage.getItem("guestAdminToken")
    : localStorage.getItem("adminToken");

  // ── Fetch products ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (!token) { onLogout(); return; }
        const res = await axios.get(`${API_URL}/api/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) onLogout();
      }
    };
    fetchProducts();
  }, [onLogout, token]);

  // ── Fetch orders (real admin only) ────────────────────────────────────────
  useEffect(() => {
    if (view !== "orders" || isGuest) return;
    const fetchOrders = async () => {
      setOrdersLoading(true);
      setOrdersError("");
      try {
        const res = await axios.get(`${API_URL}/api/orders`, {
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
  }, [view, token, isGuest]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await axios.patch(
        `${API_URL}/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: res.data.status } : o)));
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

  const handleInlineCategory = (id, categoryValue) => {
    setProducts((prev) =>
      prev.map((p) =>
        p._id === id ? { ...p, editForm: { ...p.editForm, category: categoryValue } } : p
      )
    );
  };

  // ── Add product ───────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    const finalCategory = form.category.trim();
    if (!form.title || !form.price || !finalCategory || isNaN(form.price))
      return alert("Fill all valid inputs including a category name.");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title",    form.title);
      formData.append("price",    form.price);
      formData.append("category", finalCategory); // actual name, never "Other"
      formData.append("stock",    form.stock);
      if (form.image) formData.append("image", form.image);
      const res = await axios.post(`${API_URL}/api/products`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts([...products, res.data]);
      setForm({ title: "", price: "", image: "", category: "", stock: "50" });
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Edit / update ─────────────────────────────────────────────────────────
  const handleEdit = (product) => {
    setProducts((prev) =>
      prev.map((p) =>
        p._id === product._id
          ? {
              ...p, isEditing: true,
              editForm: {
                title: product.title, price: product.price,
                image: product.image, category: product.category,
                stock: product.stock ?? 50,
              },
            }
          : { ...p, isEditing: false }
      )
    );
  };

  const handleUpdate = async (e, product) => {
    e.preventDefault();
    const data = product.editForm;
    const finalCategory = (data.category || "").trim();
    if (!finalCategory) return alert("Please specify a category.");
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("title",    data.title);
      payload.append("price",    data.price);
      payload.append("category", finalCategory);
      payload.append("stock",    data.stock);
      if (data.image) payload.append("image", data.image);
      const res = await axios.put(`${API_URL}/api/products/${product._id}`, payload, {
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

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Confirm delete?")) return;
    try {
      await axios.delete(`${API_URL}/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(products.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const statusClass = (s) => (
    { Pending: "status-pending", Confirmed: "status-confirmed", Delivered: "status-delivered", Cancelled: "status-cancelled" }[s] || ""
  );

  const stockLabel = (stock) => {
    if (stock === 0)  return <span className="stock-tag stock-out">Out of Stock</span>;
    if (stock <= 5)   return <span className="stock-tag stock-low">{stock} left</span>;
    return <span className="stock-tag stock-ok">{stock} in stock</span>;
  };

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="admin-dashboard-container">

      {isGuest && <SandboxBanner onExpire={onLogout} />}

      <div className="admin-header">
        <div className="admin-header-title">
          <h2>{isGuest ? "Guest Admin Dashboard" : "Admin Dashboard"}</h2>
          {isGuest && <span className="guest-role-badge">🎭 Sandbox</span>}
        </div>
        <div className="admin-header-actions">
          {!isGuest && (
            <button
              className={`view-orders-btn ${view === "orders" ? "active" : ""}`}
              onClick={() => setView(view === "orders" ? "products" : "orders")}
            >
              {view === "orders" ? "← Products" : "View Orders 📦"}
            </button>
          )}
          <button onClick={onLogout} className="logout-btn">
            {isGuest ? "Exit Sandbox" : "Logout"}
          </button>
        </div>
      </div>

      {/* ── ORDERS PANEL ── */}
      {view === "orders" && !isGuest && (
        <div className="orders-panel">
          <h3>All Orders</h3>
          {ordersLoading && <p className="orders-loading">Loading orders...</p>}
          {ordersError   && <p className="orders-error">{ordersError}</p>}
          {!ordersLoading && !ordersError && orders.length === 0 && (
            <p className="no-orders">No orders yet.</p>
          )}
          {orders.map((order) => (
            <div key={order._id} className="order-card">
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
                  <span className={`status-badge ${statusClass(order.status)}`}>{order.status}</span>
                  <select value={order.status} onChange={(e) => handleStatusChange(order._id, e.target.value)} className="status-select">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {order.customer && (
                <div className="customer-info-block">
                  <div className="customer-info-row"><span className="customer-info-icon">👤</span><span className="customer-info-value">{order.customer.name}</span></div>
                  <div className="customer-info-row"><span className="customer-info-icon">📞</span><a href={`tel:${order.customer.phone}`} className="customer-phone">{order.customer.phone}</a></div>
                  <div className="customer-info-row"><span className="customer-info-icon">📍</span><span className="customer-info-value">{order.customer.address}</span></div>
                </div>
              )}
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
              <div className="order-total">Total: <strong>₹{order.total.toFixed(2)}</strong></div>
            </div>
          ))}
        </div>
      )}

      {/* ── PRODUCTS PANEL ── */}
      {view === "products" && (
        <>
          <form className="product-form" onSubmit={handleAdd}>
            {isGuest && (
              <p className="sandbox-form-note">
                ✏️ Products added here exist only in your sandbox session.
              </p>
            )}
            <input name="title" placeholder="Title" value={form.title} onChange={handleFormChange} required />
            <input name="price" type="number" placeholder="Price ₹" value={form.price} onChange={handleFormChange} required />
            <input name="image" type="text" placeholder="Paste Cloudinary image URL" value={form.image} onChange={handleFormChange} />
            <CategoryField
              value={form.category}
              onChange={(val) => setForm((prev) => ({ ...prev, category: val }))}
              style={{ marginBottom: "0.8rem" }}
            />
            <input name="stock" type="number" placeholder="Stock quantity" value={form.stock} onChange={handleFormChange} min="0" required />
            <button type="submit" className="add-btn" disabled={loading}>{loading ? "Adding..." : "Add Product"}</button>
            {error && <p className="form-error">{error}</p>}
          </form>

          <div className="product-list">
            <div className="product-list-header">
              <h3>
                All Products
                {isGuest && <span className="sandbox-list-note">(Sandbox copy)</span>}
              </h3>
              <div className="product-search-wrap">
                <span className="product-search-icon"></span>
                <input
                  type="text"
                  className="product-search-input"
                  placeholder="Search by name or category…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                {productSearch && (
                  <button className="product-search-clear" onClick={() => setProductSearch("")} aria-label="Clear search">✕</button>
                )}
              </div>
            </div>

            {productSearch && (
              <p className="product-search-count">
                {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""} for "{productSearch}"
              </p>
            )}
            {filteredProducts.length === 0 && (
              <p className="product-search-empty">No products match your search.</p>
            )}

            {filteredProducts.map((product) => (
              <div key={product._id} className={`product-item ${product.isGuestAdded ? "product-item-guest" : ""}`}>
                {!product.isEditing ? (
                  <>
                    <img src={product.image || "https://placehold.co/70x70?text=No+Img"} alt={product.title} />
                    <div className="product-details">
                      <h4>
                        {product.title}
                        {product.isGuestAdded && <span className="guest-added-badge">✨ Added by you</span>}
                      </h4>
                      <p>₹{product.price} &nbsp;·&nbsp; {product.category}</p>
                      {stockLabel(product.stock ?? 0)}
                    </div>
                    <div className="product-actions">
                      <button onClick={() => handleEdit(product)} className="edit-btn">Edit</button>
                      <button onClick={() => handleDelete(product._id)} className="delete-btn">Delete</button>
                    </div>
                  </>
                ) : (
                  <form className="edit-form" onSubmit={(e) => handleUpdate(e, product)} style={{ width: "100%" }}>
                    <input name="title" value={product.editForm.title} onChange={(e) => handleInlineChange(product._id, e)} required />
                    <input name="price" type="number" value={product.editForm.price} onChange={(e) => handleInlineChange(product._id, e)} required />
                    <input name="image" type="text" placeholder="Paste Image URL" value={product.editForm.image || ""} onChange={(e) => handleInlineChange(product._id, e)} />
                    <CategoryField
                      value={product.editForm.category}
                      onChange={(val) => handleInlineCategory(product._id, val)}
                      style={{ marginBottom: "0.5rem" }}
                    />
                    <input name="stock" type="number" placeholder="Stock" value={product.editForm.stock ?? 50} onChange={(e) => handleInlineChange(product._id, e)} min="0" required />
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
