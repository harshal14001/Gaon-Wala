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
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tokenLoaded, setTokenLoaded] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setTokenLoaded(true);
        return;
      }
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await axios.get(`${API_URL}/api/products`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        setIsAdmin(true);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("adminToken");
          setIsAdmin(false);
        }
      } finally {
        setTokenLoaded(true);
      }
    };
    
    validateToken();
  }, []);

  const handleAdminLogin = (token) => {
    if (token && typeof token === "string") {
      localStorage.setItem("adminToken", token);
      setIsAdmin(true);
      setShowAdminModal(false);
    } else {
      alert("Login failed.");
    }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("adminToken");
    setIsAdmin(false);
  }, []);

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

  return !tokenLoaded ? (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Loading...</p>
    </div>
  ) : isAdmin ? (
    <AdminDashboard onLogout={handleLogout} />
  ) : (
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

      {/*  cart + onUpdateQty now passed so widget knows what's in the cart */}
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
          onClose={() => setShowAdminModal(false)}
        />
      )}
    </>
  );
};

export default App;
