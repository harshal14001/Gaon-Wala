import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config.js";
import "./Products.css";

const Products = ({ selectedCategory, searchQuery, cart, setCart }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // tracks which product ids are in the "just added" flash state
  const [flashSet, setFlashSet]   = useState(new Set());
  // tracks which qty display is animating (bounce)
  const [bounceSet, setBounceSet] = useState(new Set());
  // tracks which + button is shaking (at max stock)
  const [shakeSet, setShakeSet]   = useState(new Set());

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/products`);
        if (isMounted) {
          setAllProducts(res.data);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch products:", err);
          setError("Failed to load products");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProducts();
    return () => { isMounted = false; };
  }, []);

  const filteredProducts = allProducts
    .filter((p) =>
      selectedCategory === "all"
        ? true
        : p.category.toLowerCase() === selectedCategory.toLowerCase()
    )
    .filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const getCartQty = (productId) => {
    const item = cart.find((x) => x._id === productId);
    return item ? item.qty : 0;
  };

  // Flash helper — add id, remove after 600ms
  const triggerFlash = useCallback((id) => {
    setFlashSet((prev) => new Set(prev).add(id));
    setTimeout(() => setFlashSet((prev) => { const s = new Set(prev); s.delete(id); return s; }), 600);
  }, []);

  // Bounce helper — add id, remove after 350ms
  const triggerBounce = useCallback((id) => {
    setBounceSet((prev) => new Set(prev).add(id));
    setTimeout(() => setBounceSet((prev) => { const s = new Set(prev); s.delete(id); return s; }), 350);
  }, []);

  // Shake helper — add id, remove after 500ms
  const triggerShake = useCallback((id) => {
    setShakeSet((prev) => new Set(prev).add(id));
    setTimeout(() => setShakeSet((prev) => { const s = new Set(prev); s.delete(id); return s; }), 500);
  }, []);

  const handleAdd = (product) => {
    if (product.stock === 0) return;
    triggerFlash(product._id);
    // small delay so user sees the "✓ Added!" flash before stepper appears
    setTimeout(() => {
      setCart((prev) => [...prev, { ...product, qty: 1 }]);
    }, 300);
  };

  const handleIncrement = (product) => {
    const current = getCartQty(product._id);
    if (current >= product.stock) {
      triggerShake(product._id);
      return;
    }
    triggerBounce(product._id);
    setCart((prev) =>
      prev.map((item) =>
        item._id === product._id
          ? { ...item, qty: item.qty + 1 }
          : item
      )
    );
  };

  const handleDecrement = (productId) => {
    triggerBounce(productId);
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
        <p className="no-products-message">No products found.</p>
      ) : (
        filteredProducts.map((product) => {
          const cartQty    = getCartQty(product._id);
          const inCart     = cartQty > 0;
          const outOfStock = product.stock === 0;
          const atMax      = cartQty >= product.stock;
          const isFlashing = flashSet.has(product._id);
          const isBouncing = bounceSet.has(product._id);
          const isShaking  = shakeSet.has(product._id);

          return (
            <div
              className={`product-card
                ${outOfStock ? "out-of-stock-card" : ""}
                ${inCart     ? "in-cart-card"      : ""}
              `}
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
              <h3 className="product-title">{product.title} </h3>
              <p className="product-price">₹{product.price}  </p>

              {/* ── Button zone ── */}
              <div className="cart-buttons">

                {/* OUT OF STOCK */}
                {outOfStock && (
                  <button className="out-of-stock-btn" disabled>Out of Stock</button>
                )}

                {/* ADD TO CART (not in cart yet) */}
                {!outOfStock && !inCart && (
                  <button
                    className={`add-to-cart-btn ${isFlashing ? "btn-flash" : ""}`}
                    onClick={() => handleAdd(product)}
                    disabled={isFlashing}
                  >
                    {isFlashing ? "✓ Added!" : "Add to Cart"}
                  </button>
                )}

                {/* QTY STEPPER (already in cart) */}
                {!outOfStock && inCart && (
                  <div className="qty-stepper">
                    <button
                      className="qty-btn minus-btn"
                      onClick={() => handleDecrement(product._id)}
                      aria-label="Decrease quantity"
                    >−</button>

                    <span className={`qty-display ${isBouncing ? "qty-bounce" : ""}`}>
                      {cartQty}
                    </span>

                    <button
                      className={`qty-btn plus-btn ${atMax ? "qty-at-max" : ""} ${isShaking ? "qty-shake" : ""}`}
                      onClick={() => handleIncrement(product)}
                      aria-label="Increase quantity"
                      title={atMax ? `Max stock: ${product.stock}` : ""}
                    >+</button>
                  </div>
                )}
              </div>

              {/* Subtotal — slides in when in cart */}
              <div className={`subtotal-row ${inCart ? "subtotal-visible" : ""}`}>
                ₹{(product.price * cartQty).toFixed(2)}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default Products;
