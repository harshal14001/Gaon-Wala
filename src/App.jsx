// src/App.jsx
import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { Routes, Route, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "./config.js";
import { SLUG_TO_CATEGORY } from "./constants/categories.js";

// ── Always eager: these are on the critical path for every visitor ────────────
import Banner   from "./Banner/Banner";
import Icons    from "./Icons/Icons";
import Products from "./Products/Products";
import Scroll   from "./Top_Scroll/Scroll";

// ── Lazy: loaded only when the user actually triggers them ────────────────────
const CartPopup      = lazy(() => import("./Cart/CartPopup"));
const AIChatWidget   = lazy(() => import("./Components/AIChatWidget"));
const AdminLogin     = lazy(() => import("./Components/AdminLogin.jsx"));
const AdminDashboard = lazy(() => import("./Components/AdminDashboard.jsx"));

// Minimal inline fallback — keeps CLS at 0 (no layout jump)
const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem" }}>
    <span style={{ fontSize: "1.2rem", color: "#aaa" }}>Loading…</span>
  </div>
);

// ── Inner shop page — lives inside a Route so it can read :category param ──
const ShopPage = ({
  cart, setCart,
  showCart, setShowCart,
  showAdminModal, setShowAdminModal,
  onAdminLogin, onGuestLogin,
}) => {
  const { category: slug } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Derive DB-facing category from URL slug — no slug = "all"
  const selectedCategory = slug ? (SLUG_TO_CATEGORY[slug] ?? "all") : "all";

  // Unknown slug → redirect to "/"
  useEffect(() => {
    if (slug && !SLUG_TO_CATEGORY[slug]) navigate("/", { replace: true });
  }, [slug, navigate]);

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
          return { ...item, qty: Math.min(newQty, item.stock ?? newQty) };
        })
      );
    }
  };

  const handleOrderPlaced = () => setCart([]);

  return (
    <>
      <Scroll />
      <Banner
        cart={cart}
        onCartClick={() => setShowCart(true)}
        onSearch={setSearchQuery}
        onAdminClick={() => setShowAdminModal(true)}
      />
      <Icons selectedCategory={selectedCategory} />
      <Products
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        cart={cart}
        setCart={setCart}
      />

      {/* AIChatWidget deferred — not on critical path */}
      <Suspense fallback={null}>
        <AIChatWidget
          cart={cart}
          onAddToCart={handleAddToCart}
          onUpdateQty={handleUpdateQty}
        />
      </Suspense>

      {/* CartPopup only mounted when user opens it */}
      {showCart && (
        <Suspense fallback={<Spinner />}>
          <CartPopup
            cart={cart}
            onClose={() => setShowCart(false)}
            onRemoveFromCart={handleRemoveFromCart}
            onUpdateQty={handleUpdateQty}
            onOrderPlaced={handleOrderPlaced}
          />
        </Suspense>
      )}

      {/* AdminLogin only mounted when user clicks admin icon */}
      {showAdminModal && (
        <Suspense fallback={<Spinner />}>
          <AdminLogin
            onLoginSuccess={onAdminLogin}
            onGuestSuccess={onGuestLogin}
            onClose={() => setShowAdminModal(false)}
          />
        </Suspense>
      )}
    </>
  );
};

// ── Root App — handles auth state, delegates to admin or shop ──────────────
const App = () => {
  const [isAdmin, setIsAdmin]               = useState(false);
  const [isGuest, setIsGuest]               = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [cart, setCart]                     = useState([]);
  const [showCart, setShowCart]             = useState(false);
  const [tokenLoaded, setTokenLoaded]       = useState(false);

  // ── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    const validateToken = async () => {
      const token      = localStorage.getItem("adminToken");
      const guestToken = localStorage.getItem("guestAdminToken");

      if (token) {
        try {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 5000);
          await axios.get(`${API_URL}/api/products`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
          clearTimeout(tid);
          setIsAdmin(true);
          setTokenLoaded(true);
          return;
        } catch (err) {
          if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem("adminToken");
          }
        }
      }

      if (guestToken) {
        try {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 5000);
          await axios.get(`${API_URL}/api/products`, {
            headers: { Authorization: `Bearer ${guestToken}` },
            signal: controller.signal,
          });
          clearTimeout(tid);
          setIsGuest(true);
          setTokenLoaded(true);
          return;
        } catch {
          localStorage.removeItem("guestAdminToken");
          localStorage.removeItem("guestTokenExpiry");
        }
      }

      setTokenLoaded(true);
    };

    validateToken();
  }, []);

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

  const handleGuestLogin = useCallback((token, expiresIn) => {
    if (token && typeof token === "string") {
      localStorage.setItem("guestAdminToken", token);
      localStorage.setItem("guestTokenExpiry", String(Date.now() + expiresIn * 1000));
      setIsGuest(true);
      setIsAdmin(false);
      setShowAdminModal(false);
    } else {
      alert("Guest login failed.");
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("adminToken");
    setIsAdmin(false);
  }, []);

  const handleGuestLogout = useCallback(() => {
    localStorage.removeItem("guestAdminToken");
    localStorage.removeItem("guestTokenExpiry");
    setIsGuest(false);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!tokenLoaded) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Loading…</p>
      </div>
    );
  }

  // Admin/Guest — full-page takeover, lazy loaded (visitors never pay this cost)
  if (isAdmin || isGuest) {
    return (
      <Suspense fallback={<Spinner />}>
        <AdminDashboard
          onLogout={isAdmin ? handleLogout : handleGuestLogout}
          isGuest={isGuest}
        />
      </Suspense>
    );
  }

  // Public shop — routes drive category selection
  return (
    <Routes>
      <Route
        path="/:category?"
        element={
          <ShopPage
            cart={cart}
            setCart={setCart}
            showCart={showCart}
            setShowCart={setShowCart}
            showAdminModal={showAdminModal}
            setShowAdminModal={setShowAdminModal}
            onAdminLogin={handleAdminLogin}
            onGuestLogin={handleGuestLogin}
          />
        }
      />
    </Routes>
  );
};

export default App;
