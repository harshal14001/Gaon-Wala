// // EditProductModal.jsx
// import React from "react";
// import "./AdminDashboard.css";

// const EditProductModal = ({
//   form,
//   onChange,
//   onClose,
//   onSubmit,
//   loading,
//   imagePreviewUrl
// }) => {
//   return (
//     <div className="edit-inline-wrapper">
//       <div className="edit-inline-box">
//         <h4>Edit Product</h4>
//         {imagePreviewUrl && (
//           <div className="edit-image-preview">
//             <img src={imagePreviewUrl} alt="Preview" />
//           </div>
//         )}
//         <form onSubmit={onSubmit}>
//           <input
//             type="text"
//             name="title"
//             value={form.title}
//             onChange={onChange}
//             placeholder="Title"
//             required
//           />
//           <input
//             type="number"
//             name="price"
//             value={form.price}
//             onChange={onChange}
//             placeholder="Price"
//             required
//             min="0"
//             step="1"
//           />
//           <input
//             type="file"
//             name="image"
//             accept="image/*"
//             onChange={onChange}
//           />
//           <input
//             type="text"
//             name="category"
//             value={form.category}
//             onChange={onChange}
//             placeholder="Category"
//             required
//           />
//           <div className="modal-btn-group">
//             <button type="submit" className="add-btn" disabled={loading}>
//               {loading ? "Updating..." : "Update"}
//             </button>
//             <button type="button" className="delete-btn" onClick={onClose}>
//               Cancel
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default EditProductModal;

// EditProductModal.jsx
import React, { useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const EditProductModal = ({ product, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    title: product.title || "",
    price: product.price || "",
    image: null,
    category: product.category || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({ ...prev, [name]: files ? files[0] : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.category || isNaN(form.price)) {
      alert("Please enter valid product data.");
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

      const res = await axios.put(`http://localhost:5000/api/products/${product._id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      onUpdated(res.data);
      onClose();
    } catch (err) {
      console.error("Update failed", err);
      setError("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-inline-wrapper">
      <div className="edit-inline-box">
        <h3>Edit Product</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Title"
            required
          />
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Price"
            required
            min="0"
            step="1"
          />
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
          />
          <input
            type="text"
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="Category"
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
