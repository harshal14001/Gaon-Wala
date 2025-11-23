import jwt from "jsonwebtoken";

export const protectAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET || "supersecretkey";
    const decoded = jwt.verify(token, secret);
    req.adminId = decoded.id; 
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};