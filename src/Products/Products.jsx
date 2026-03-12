import { useEffect, useState } from "react";
import axios from "axios";
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
    .filter((p) =>
      selectedCategory === "all"
        ? true
        : p.category.toLowerCase() === selectedCategory.toLowerCase()
    )
    .filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // How many of this product are currently in the cart
  const getCartQty = (productId) => {
    const item = cart.find((x) => x._id === productId);
    return item ? item.qty : 0;
  };

  // Add to cart for the first time
  const handleAdd = (product) => {
    if (product.stock === 0) return;
    setCart((prev) => [...prev, { ...product, qty: 1 }]);
  };

  // Increment qty — never exceed available stock
  const handleIncrement = (product) => {
    setCart((prev) =>
      prev.map((item) =>
        item._id === product._id
          ? { ...item, qty: Math.min(item.qty + 1, product.stock) }
          : item
      )
    );
  };

  // Decrement qty — remove from cart if it hits 0
  const handleDecrement = (productId) => {
    setCart((prev) => {
      const item = prev.find((x) => x._id === productId);
      if (!item) return prev;
      if (item.qty <= 1) return prev.filter((x) => x._id !== productId);
      return prev.map((x) => (x._id === productId ? { ...x, qty: x.qty - 1 } : x));
    });
  };

  return (
    <div className="product-grid">
      {filteredProducts.length === 0 ? (
        <p className="no-products-message">No products available to display.</p>
      ) : (
        filteredProducts.map((product) => {
          const cartQty   = getCartQty(product._id);
          const inCart    = cartQty > 0;
          const outOfStock = product.stock === 0;
          const atMax     = cartQty >= product.stock;

          return (
            <div
              className={`product-card ${outOfStock ? "out-of-stock-card" : ""}`}
              key={product._id}
            >
              {/* Stock badge */}
              {outOfStock ? (
                <span className="stock-badge out-of-stock-badge">Out of Stock</span>
              ) : product.stock <= 5 ? (
                <span className="stock-badge low-stock-badge">Only {product.stock} left!</span>
              ) : null}

              <img
                src={product.image || "/placeholder.png"}
                alt={product.title}
                className={`product-image ${outOfStock ? "img-greyed" : ""}`}
              />
              <h3 className="product-title">{product.title}</h3>
              <p className="product-price">₹{product.price}</p>

              <div className="cart-buttons">
                {outOfStock ? (
                  <button className="out-of-stock-btn" disabled>Out of Stock</button>

                ) : !inCart ? (
                  <button className="add-to-cart-btn" onClick={() => handleAdd(product)}>
                    Add to Cart
                  </button>

                ) : (
                  <div className="qty-stepper">
                    <button
                      className="qty-btn minus-btn"
                      onClick={() => handleDecrement(product._id)}
                    >−</button>

                    <span className="qty-display">{cartQty}</span>

                    <button
                      className={`qty-btn plus-btn ${atMax ? "qty-btn-disabled" : ""}`}
                      onClick={() => handleIncrement(product)}
                      disabled={atMax}
                      title={atMax ? `Max ${product.stock} available` : ""}
                    >+</button>
                  </div>
                )}
              </div>

              {/* Show subtotal when item is in cart */}
              {inCart && (
                <p className="cart-subtotal">
                  Subtotal: ₹{(product.price * cartQty).toFixed(2)}
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default Products;
