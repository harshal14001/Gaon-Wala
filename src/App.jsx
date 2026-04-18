// src/App.jsx
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_URL } from "./config.js";

import Banner from "./Banner/Banner";
import Icons from "./Icons/Icons";
import Products from "./Products/Products";
import Scroll from "./Top_Scroll/Scroll";
import CartPopup from "./Cart/CartPopup";
import AIChatWidget from "./Components/AIChatWidget";
import AdminLogin from "./Components/AdminLogin.jsx";
import AdminDashboard from "./Components/AdminDashboard.jsx";

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);          // NEW: guest admin flag
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tokenLoaded, setTokenLoaded] = useState(false);

  // ── On mount: restore session from localStorage ──────────────────────────
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("adminToken");
      const guestToken = localStorage.getItem("guestAdminToken");

      // 1. Check for a valid real-admin token
      if (token) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          await axios.get(`${API_URL}/api/products`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          setIsAdmin(true);
          setTokenLoaded(true);
          return;
        } catch (err) {
          if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem("adminToken");
          }
        }
      }

      // 2. Check for a live guest token (verify it hasn't expired)
      if (guestToken) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          await axios.get(`${API_URL}/api/products`, {
            headers: { Authorization: `Bearer ${guestToken}` },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          setIsGuest(true);
          setTokenLoaded(true);
          return;
        } catch (err) {
          // Expired or invalid — clear it silently
          localStorage.removeItem("guestAdminToken");
          localStorage.removeItem("guestTokenExpiry");
        }
      }

      setTokenLoaded(true);
    };

    validateToken();
  }, []);

  // ── Real admin login ──────────────────────────────────────────────────────
  const handleAdminLogin = (token) => {
    if (token && typeof token === "string") {
      localStorage.setItem("adminToken", token);
      setIsAdmin(true);
      setIsGuest(false);
      setShowAdminModal(false);
    } else {
      alert("Login failed.");
    }
  };

  // ── Guest admin login (NEW) ───────────────────────────────────────────────
  const handleGuestLogin = useCallback((token, expiresIn) => {
    if (token && typeof token === "string") {
      localStorage.setItem("guestAdminToken", token);
      // Store exact expiry timestamp so the dashboard countdown is accurate
      localStorage.setItem("guestTokenExpiry", String(Date.now() + expiresIn * 1000));
      setIsGuest(true);
      setIsAdmin(false);
      setShowAdminModal(false);
    } else {
      alert("Guest login failed.");
    }
  }, []);

  // ── Real admin logout ─────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    localStorage.removeItem("adminToken");
    setIsAdmin(false);
  }, []);

  // ── Guest logout (NEW) ────────────────────────────────────────────────────
  const handleGuestLogout = useCallback(() => {
    localStorage.removeItem("guestAdminToken");
    localStorage.removeItem("guestTokenExpiry");
    setIsGuest(false);
  }, []);

  // ── Cart helpers (unchanged) ──────────────────────────────────────────────
  const handleAddToCart = (product) => {
    const exist = cart.find((x) => x._id === product._id);
    if (exist) {
      const newQty = exist.qty + 1;
      if (newQty > (product.stock ?? Infinity)) return;
      setCart(cart.map((x) => x._id === product._id ? { ...exist, qty: newQty } : x));
    } else {
      if ((product.stock ?? 1) === 0) return;
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item._id !== productId));
  };

  const handleUpdateQty = (productId, newQty) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item._id !== productId));
    } else {
      setCart((prev) =>
        prev.map((item) => {
          if (item._id !== productId) return item;
          const capped = Math.min(newQty, item.stock ?? newQty);
          return { ...item, qty: capped };
        })
      );
    }
  };

  const handleOrderPlaced = () => setCart([]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!tokenLoaded) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Real admin view
  if (isAdmin) {
    return <AdminDashboard onLogout={handleLogout} isGuest={false} />;
  }

  // Guest admin view
  if (isGuest) {
    return <AdminDashboard onLogout={handleGuestLogout} isGuest={true} />;
  }

  // Public / shopper view
  return (
    <>
      <Scroll />
      <Banner
        cart={cart}
        onCartClick={() => setShowCart(true)}
        onSearch={setSearchQuery}
        onAdminClick={() => setShowAdminModal(true)}
      />
      <Icons onCategorySelect={setSelectedCategory} />
      <Products
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        cart={cart}
        setCart={setCart}
      />

      <AIChatWidget
        cart={cart}
        onAddToCart={handleAddToCart}
        onUpdateQty={handleUpdateQty}
      />

      {showCart && (
        <CartPopup
          cart={cart}
          onClose={() => setShowCart(false)}
          onRemoveFromCart={handleRemoveFromCart}
          onUpdateQty={handleUpdateQty}
          onOrderPlaced={handleOrderPlaced}
        />
      )}

      {showAdminModal && (
        <AdminLogin
          onLoginSuccess={handleAdminLogin}
          onGuestSuccess={handleGuestLogin}
          onClose={() => setShowAdminModal(false)}
        />
      )}
    </>
  );
};

export default App;
