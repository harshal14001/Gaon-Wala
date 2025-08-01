// EditProductModal.jsx
import React from "react";
import "./AdminDashboard.css";

const EditProductModal = ({
  form,
  onChange,
  onClose,
  onSubmit,
  loading,
  imagePreviewUrl
}) => {
  return (
    <div className="edit-inline-wrapper">
      <div className="edit-inline-box">
        <h4>Edit Product</h4>
        {imagePreviewUrl && (
          <div className="edit-image-preview">
            <img src={imagePreviewUrl} alt="Preview" />
          </div>
        )}
        <form onSubmit={onSubmit}>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="Title"
            required
          />
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={onChange}
            placeholder="Price"
            required
            min="0"
            step="1"
          />
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={onChange}
          />
          <input
            type="text"
            name="category"
            value={form.category}
            onChange={onChange}
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
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
