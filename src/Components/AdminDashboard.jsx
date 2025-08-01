// // import React, { useState, useEffect } from "react";
// // import axios from "axios";
// // import "./AdminDashboard.css";
// // import EditProductModal from "./EditProductModal"; // handle edit product

// // const AdminDashboard = ({ onLogout }) => {
// //   const [products, setProducts] = useState([]);
// //   const [form, setForm] = useState({ title: "", price: "", image: null, category: "" });
// //   const [editingId, setEditingId] = useState(null);
// //   const [loading, setLoading] = useState(false);
// //   const [error, setError] = useState("");

// //   const fetchProducts = async () => {
// //     try {
// //       const token = localStorage.getItem("adminToken");
// //       const res = await axios.get("http://localhost:5000/api/products", {
// //         headers: { Authorization: `Bearer ${token}` }
// //       });
// //       setProducts(Array.isArray(res.data) ? res.data : []);
// //     } catch (err) {
// //       console.error("Error fetching products", err);
// //     }
// //   };

// //   useEffect(() => { fetchProducts(); }, []);

// //   const handleChange = (e) => {
// //     const { name, value, files } = e.target;
// //     setForm((prev) => ({ ...prev, [name]: files ? files[0] : value }));
// //   };

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     if (!form.title || !form.price || !form.category || isNaN(form.price)) {
// //       alert("All fields must be valid.");
// //       return;
// //     }
// //     setLoading(true);
// //     try {
// //       const token = localStorage.getItem("adminToken");
// //       if (editingId) {
// //         const payload = { ...form };
// //         if (!form.image) delete payload.image;

// //         const res = await axios.put(`http://localhost:5000/api/products/${editingId}`, payload, {
// //           headers: { Authorization: `Bearer ${token}` },
// //         });
// //         setProducts(products.map((p) => (p._id === editingId ? res.data : p)));
// //       } else {
// //         const formData = new FormData();
// //         formData.append("title", form.title);
// //         formData.append("price", form.price);
// //         formData.append("category", form.category);
// //         if (form.image) formData.append("image", form.image);

// //         const res = await axios.post("http://localhost:5000/api/products", formData, {
// //           headers: {
// //             Authorization: `Bearer ${token}`,
// //             "Content-Type": "multipart/form-data"
// //           },
// //         });
// //         setProducts([...products, res.data]);
// //       }
// //       setForm({ title: "", price: "", image: null, category: "" });
// //       setEditingId(null);
// //     } catch (err) {
// //       console.error("Product operation failed", err);
// //       setError("Something went wrong");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleEdit = (product) => {
// //     setForm({
// //       title: product.title,
// //       price: product.price,
// //       image: null,
// //       category: product.category,
// //     });
// //     setEditingId(product._id);
// //   };

// //   const handleDeleteProduct = async (id) => {
// //     if (!window.confirm("Are you sure you want to delete this product?")) return;
// //     try {
// //       const token = localStorage.getItem("adminToken");
// //       await axios.delete(`http://localhost:5000/api/products/${id}`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });
// //       setProducts(products.filter((p) => p._id !== id));
// //     } catch (err) {
// //       console.error("Error deleting product", err);
// //     }
// //   };

// //   return (
// //     <div className="admin-dashboard-container">
// //       <div className="admin-header">
// //         <h2>Admin Dashboard</h2>
// //         <button onClick={onLogout} className="logout-btn">Logout</button>
// //       </div>

// //       <form className="product-form" onSubmit={handleSubmit}>
// //         <input type="text" name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
// //         <input type="number" name="price" placeholder="Price ₹ " value={form.price} onChange={handleChange} required min="0" step="1" />
// //         <input type="file" name="image" accept="image/*" onChange={handleChange} />
// //         <input type="text" name="category" placeholder="Category" value={form.category} onChange={handleChange} required />
// //         <button type="submit" className="add-btn" disabled={loading}>
// //           {editingId ? (loading ? "Updating..." : "Update Product") : (loading ? "Adding..." : "Add Product")}
// //         </button>
// //         {error && <p className="form-error">{error}</p>}
// //       </form>

// //       <div className="product-list">
// //         <h3>All Products</h3>
// //         {products.map((product) => (
// //           <div className="product-item" key={product._id}>
// //             <img src={`http://localhost:5000/uploads/${product.image}`} alt={product.title} />
// //             <div className="product-details">
// //               <h4>{product.title}</h4>
// //               <p>₹{product.price}</p>
// //               <p>{product.category}</p>
// //             </div>
// //             <div className="product-actions">
// //               <button className="edit-btn" onClick={() => handleEdit(product)}>Edit</button>
// //               <button className="delete-btn" onClick={() => handleDeleteProduct(product._id)}>Delete</button>
// //             </div>
// //           </div>
// //         ))}
// //       </div>
// //     </div>
// //   );
// // };

// // export default AdminDashboard;
// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import "./AdminDashboard.css";
// import EditProductModal from "./EditProductModal"; // handle edit product

// const AdminDashboard = ({ onLogout }) => {
//   const [products, setProducts] = useState([]);
//   const [form, setForm] = useState({ title: "", price: "", image: null, category: "" });
//   const [editingId, setEditingId] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const fetchProducts = async () => {
//     try {
//       const token = localStorage.getItem("adminToken");
//       const res = await axios.get("http://localhost:5000/api/products", {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setProducts(Array.isArray(res.data) ? res.data : []);
//     } catch (err) {
//       console.error("Error fetching products", err);
//     }
//   };

//   useEffect(() => { fetchProducts(); }, []);

//   const handleChange = (e) => {
//     const { name, value, files } = e.target;
//     setForm((prev) => ({ ...prev, [name]: files ? files[0] : value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!form.title || !form.price || !form.category || isNaN(form.price)) {
//       alert("All fields must be valid.");
//       return;
//     }
//     setLoading(true);
//     try {
//       const token = localStorage.getItem("adminToken");
//       if (editingId) {
//         const formData = new FormData();
//         formData.append("title", form.title);
//         formData.append("price", form.price);
//         formData.append("category", form.category);
//         if (form.image) formData.append("image", form.image);

//         const res = await axios.put(`http://localhost:5000/api/products/${editingId}`, formData, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "multipart/form-data"
//           },
//         });
//         setProducts(products.map((p) => (p._id === editingId ? res.data : p)));
//       } else {
//         const formData = new FormData();
//         formData.append("title", form.title);
//         formData.append("price", form.price);
//         formData.append("category", form.category);
//         if (form.image) formData.append("image", form.image);

//         const res = await axios.post("http://localhost:5000/api/products", formData, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "multipart/form-data"
//           },
//         });
//         setProducts([...products, res.data]);
//       }
//       setForm({ title: "", price: "", image: null, category: "" });
//       setEditingId(null);
//     } catch (err) {
//       console.error("Product operation failed", err);
//       setError("Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEdit = (product) => {
//     setForm({
//       title: product.title,
//       price: product.price,
//       image: null,
//       category: product.category,
//     });
//     setEditingId(product._id);
//   };

//   const handleDeleteProduct = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this product?")) return;
//     try {
//       const token = localStorage.getItem("adminToken");
//       await axios.delete(`http://localhost:5000/api/products/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setProducts(products.filter((p) => p._id !== id));
//     } catch (err) {
//       console.error("Error deleting product", err);
//     }
//   };

//   return (
//     <div className="admin-dashboard-container">
//       <div className="admin-header">
//         <h2>Admin Dashboard</h2>
//         <button onClick={onLogout} className="logout-btn">Logout</button>
//       </div>

//       <form className="product-form" onSubmit={handleSubmit}>
//         <input type="text" name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
//         <input type="number" name="price" placeholder="Price ₹ " value={form.price} onChange={handleChange} required min="0" step="1" />
//         <input type="file" name="image" accept="image/*" onChange={handleChange} />
//         <input type="text" name="category" placeholder="Category" value={form.category} onChange={handleChange} required />
//         <button type="submit" className="add-btn" disabled={loading}>
//           {editingId ? (loading ? "Updating..." : "Update Product") : (loading ? "Adding..." : "Add Product")}
//         </button>
//         {error && <p className="form-error">{error}</p>}
//       </form>

//       <div className="product-list">
//         <h3>All Products</h3>
//         {products.map((product) => (
//           <div className="product-item" key={product._id}>
//             <img src={`http://localhost:5000/uploads/${product.image}`} alt={product.title} />
//             <div className="product-details">
//               <h4>{product.title}</h4>
//               <p>₹{product.price}</p>
//               <p>{product.category}</p>
//             </div>
//             <div className="product-actions">
//               <button className="edit-btn" onClick={() => handleEdit(product)}>Edit</button>
//               <button className="delete-btn" onClick={() => handleDeleteProduct(product._id)}>Delete</button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {editingId && (
//         <EditProductModal
//           form={form}
//           onChange={handleChange}
//           onClose={() => setEditingId(null)}
//           onSubmit={handleSubmit}
//           loading={loading}
//         />
//       )}
//     </div>
//   );
// };

// export default AdminDashboard;
// In AdminDashboard.jsx

// 2 
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const AdminDashboard = ({ onLogout }) => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ title: "", price: "", image: null, category: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({ ...prev, [name]: files ? files[0] : value }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.category || isNaN(form.price)) {
      alert("All fields must be valid.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("price", form.price);
      formData.append("category", form.category);
      if (form.image) formData.append("image", form.image);

      const res = await axios.post("http://localhost:5000/api/products", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setProducts([...products, res.data]);
      setForm({ title: "", price: "", image: null, category: "" });
    } catch (err) {
      console.error("Product add failed", err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e, id) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.category || isNaN(form.price)) {
      alert("All fields must be valid.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("price", form.price);
      formData.append("category", form.category);
      if (form.image) formData.append("image", form.image);

      const res = await axios.put(`http://localhost:5000/api/products/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setProducts(products.map((p) => (p._id === id ? res.data : p)));
      setEditingId(null);
      setForm({ title: "", price: "", image: null, category: "" });
    } catch (err) {
      console.error("Product update failed", err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(products.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Error deleting product", err);
    }
  };

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </div>

      <form className="product-form" onSubmit={handleAddProduct}>
        <input type="text" name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
        <input type="number" name="price" placeholder="Price ₹ " value={form.price} onChange={handleChange} required min="0" step="1" />
        <input type="file" name="image" accept="image/*" onChange={handleChange} />
        <input type="text" name="category" placeholder="Category" value={form.category} onChange={handleChange} required />
        <button type="submit" className="add-btn" disabled={loading}>
          Add Product
        </button>
        {error && <p className="form-error">{error}</p>}
      </form>

      <div className="product-list">
        <h3>All Products</h3>
        {products.map((product) => (
          <div className="product-item" key={product._id}>
            <img src={`http://localhost:5000/uploads/${product.image}`} alt={product.title} />
            <div className="product-details">
              <h4>{product.title}</h4>
              <p>₹{product.price}</p>
              <p>{product.category}</p>
            </div>
            <div className="product-actions">
              <button className="edit-btn" onClick={() => {
                setEditingId(product._id);
                setForm({ title: product.title, price: product.price, image: null, category: product.category });
              }}>Edit</button>
              <button className="delete-btn" onClick={() => handleDeleteProduct(product._id)}>Delete</button>
            </div>

            {editingId === product._id && (
              <form className="edit-form" onSubmit={(e) => handleUpdateProduct(e, product._id)}>
                <input type="text" name="title" value={form.title} onChange={handleChange} required />
                <input type="number" name="price" value={form.price} onChange={handleChange} required />
                <input type="file" name="image" accept="image/*" onChange={handleChange} />
                <input type="text" name="category" value={form.category} onChange={handleChange} required />
                <button type="submit" className="add-btn" disabled={loading}>{loading ? "Saving..." : "Update"}</button>
                <button type="button" className="delete-btn" onClick={() => setEditingId(null)}>Cancel</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
