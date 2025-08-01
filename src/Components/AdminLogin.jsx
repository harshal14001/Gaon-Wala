import { useState } from "react";
import axios from "axios";
import "./AdminLogin.css";

const AdminLogin = ({ onLoginSuccess, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("Click works");
    console.log("email:", email, "password:", password);

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/admin/login", {
        email,
        password,
      });

      console.log("Server response:", res.data);

      if (res.data?.token) {
        localStorage.setItem("adminToken", res.data.token);
        onLoginSuccess();
      } else {
        setError("No token returned from server");
      }
    } catch (err) {
      console.error("Login failed", err);
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose} aria-label="Close">×</button>
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
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
          <button type="submit" disabled={loading} className="login-btn">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;