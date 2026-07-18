import { useState } from "react";
import axios from "axios";
import { API_URL } from "../config.js";
import "./AdminLogin.css";

// onLoginSuccess  → real admin token (string)
// onGuestSuccess  → { token, expiresIn } for sandbox session
// onClose         → close the modal
const AdminLogin = ({ onLoginSuccess, onGuestSuccess, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  // ── Real admin login (unchanged) ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_URL}/api/admin/login`, { email, password });
      if (res.data && res.data.token) {
        onLoginSuccess(res.data.token);
      } else {
        setError("Token missing in response");
      }
    } catch (err) {
      console.error(err);
      setError("Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  // ── Guest admin login (new) ───────────────────────────────────────────────
  const handleGuestLogin = async () => {
    setGuestLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_URL}/api/admin/guest-login`);
      if (res.data && res.data.token) {
        onGuestSuccess(res.data.token, res.data.expiresIn);
      } else {
        setError("Guest login failed — please try again");
      }
    } catch (err) {
      console.error(err);
      setError("Guest login failed — server error");
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose} aria-label="Close">×</button>
        <h2>Admin Login</h2>

        {/* ── Real admin form ── */}
        <form onSubmit={handleSubmit}>
          {error && <p className="error">{error}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading || guestLoading} className="login-btn">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* ── Guest admin section ── */}
        <div className="login-divider">or</div>
        <button
          className="guest-login-btn"
          onClick={handleGuestLogin}
          disabled={loading || guestLoading}
        >
          {guestLoading ? "Setting up sandbox..." : "🎭 Try as Guest Admin"}
        </button>
        <p className="guest-hint">No login needed · Sandbox mode · 10 min session</p>
      </div>
    </div>
  );
};

export default AdminLogin;
