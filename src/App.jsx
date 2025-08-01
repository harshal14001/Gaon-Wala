import { useEffect, useState } from "react";

import Banner from "./Banner/Banner";
import Icons from "./Icons/Icons";
import Products from "./Products/Products";
import Scroll from "./Top_Scroll/Scroll";
import CartPopup from "./Cart/CartPopup";


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
    localStorage.setItem("adminToken", token);
    setIsAdmin(true);
    setShowAdminModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAdmin(false);
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
        onAdminClick={() => setShowAdminModal(true)} // 💡 triggers modal
      />
      <Icons onCategorySelect={setSelectedCategory} />
      <Products
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        cart={cart}
        setCart={setCart}
      />
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
