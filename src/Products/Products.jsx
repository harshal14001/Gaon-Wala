import { useEffect, useState } from 'react';
import axios from 'axios';
import "./Products.css";

const Products = ({ selectedCategory, searchQuery, cart, setCart }) => {
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/products");
        setAllProducts(res.data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = allProducts
    .filter((product) =>
      selectedCategory === "all"
        ? true
        : product.category.toLowerCase() === selectedCategory.toLowerCase()
    )
    .filter((product) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const isInCart = (productId) => cart.some((item) => item._id === productId);

  const handleAddToCart = (product) => {
    if (isInCart(product._id)) return;
    // ✅ Always include qty:1 so total calculation and order payload work correctly
    setCart((prevCart) => [...prevCart, { ...product, qty: 1 }]);
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== productId));
  };

  return (
    <div className="product-grid">
      {filteredProducts.length === 0 ? (
        <p className="no-products-message">No products available to display.</p>
      ) : (
        filteredProducts.map((product) => {
          const inCart = isInCart(product._id);
          return (
            <div className="product-card" key={product._id}>
              <img
                src={product.image || "/placeholder.png"}
                alt={product.title}
                className="product-image"
              />
              <h3 className="product-title">{product.title}</h3>
              <p className="product-price">₹{product.price}</p>

              <div className="cart-buttons">
                {!inCart ? (
                  <button className="add-to-cart-btn" onClick={() => handleAddToCart(product)}>
                    Add to Cart
                  </button>
                ) : (
                  <>
                    <button className="in-cart-btn" disabled>In Cart</button>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveFromCart(product._id)}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default Products;
