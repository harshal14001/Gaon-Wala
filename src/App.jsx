// src/App.jsx
import { useEffect, useState } from "react";

import Banner from "./Banner/Banner";
import Icons from "./Icons/Icons";
import Products from "./Products/Products";
import Scroll from "./Top_Scroll/Scroll";
import CartPopup from "./Cart/CartPopup";

// Chat Widget Import
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

  // 👇 UPDATED: No more alert popup!
  const handleAddToCart = (product) => {
    const exist = cart.find((x) => x._id === product._id);
    if (exist) {
      setCart(cart.map((x) => x._id === product._id ? { ...exist, qty: exist.qty + 1 } : x));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    // alert(`${product.title} added to cart! 🛒`); // ❌ REMOVED THIS LINE
    
    // Optional: Open the cart immediately to show it was added
    // setShowCart(true); 
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== productId));
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

      {/* Chat Widget */}
      <AIChatWidget onAddToCart={handleAddToCart} />

      {showCart && (
        <CartPopup
          cart={cart}
          onClose={() => setShowCart(false)}
          onRemoveFromCart={handleRemoveFromCart}
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