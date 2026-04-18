import Admin from '../Models/Admin.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Products from '../Models/Products.js';
import { seedSession } from '../utils/sandboxStore.js';

// ── Real admin login (unchanged) ──────────────────────────────────────────────
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ── Guest admin login (new) ───────────────────────────────────────────────────
// Issues a short-lived JWT scoped to a sandbox session seeded from the real DB.
// No credentials required — just provides a sandboxed view.
export const guestLogin = async (req, res) => {
  try {
    const sessionId = crypto.randomUUID();

    // Fetch current real products to pre-populate the sandbox
    const realProducts = await Products.find().lean();
    seedSession(sessionId, realProducts);

    const EXPIRES_SECONDS = 10 * 60; // 30 minutes
    const token = jwt.sign(
      { role: 'guest', sessionId },
      process.env.JWT_SECRET,
      { expiresIn: EXPIRES_SECONDS }
    );

    res.json({ token, role: 'guest', expiresIn: EXPIRES_SECONDS });
  } catch (error) {
    console.error("Guest login error:", error);
    res.status(500).json({ message: "Failed to create guest session", error });
  }
};
