import jwt from "jsonwebtoken";

// ── Real admin protection (unchanged behaviour) ───────────────────────────────
export const protectAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.id;
    req.user = { role: 'admin', id: decoded.id };
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

// ── Combined middleware: accepts both real admin and guest tokens ──────────────
// Sets req.user = { role: 'admin', id } or { role: 'guest', sessionId }
export const protectAdminOrGuest = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'guest') {
      // Guest path — carry sessionId for sandbox lookup
      req.user = { role: 'guest', sessionId: decoded.sessionId };
    } else {
      // Real admin path — backward-compat: keep req.adminId as well
      req.user = { role: 'admin', id: decoded.id };
      req.adminId = decoded.id;
    }

    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};
