// src/App.jsx
import { useEffect, useState } from "react";

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

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) setIsAdmin(true);
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

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAdmin(false);
  };

  // Used by AIChatWidget
  const handleAddToCart = (product) => {
    const exist = cart.find((x) => x._id === product._id);
    if (exist) {
      const newQty = exist.qty + 1;
      if (newQty > (product.stock ?? Infinity)) return; // respect stock
      setCart(cart.map((x) => x._id === product._id ? { ...exist, qty: newQty } : x));
    } else {
      if ((product.stock ?? 1) === 0) return;
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item._id !== productId));
  };

  // Called from CartPopup stepper — set qty; remove if 0
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

  const handleOrderPlaced = () => {
    setCart([]);
  };

  return isAdmin ? (
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

      <AIChatWidget onAddToCart={handleAddToCart} />

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
