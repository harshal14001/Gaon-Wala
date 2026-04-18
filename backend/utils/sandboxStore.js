// utils/sandboxStore.js
// In-memory sandbox store for guest admin sessions.
// Guest operations (add / edit / delete) are isolated here — no DB is touched.

import crypto from "crypto";

const store = new Map(); // sessionId → { products: [...], expiresAt: timestamp }

const SESSION_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Seed a new sandbox session with a deep-clone of the real product list.
 * Called once at guest login.
 */
export const seedSession = (sessionId, realProducts) => {
  store.set(sessionId, {
    products: JSON.parse(JSON.stringify(realProducts)),
    expiresAt: Date.now() + SESSION_TTL,
  });
};

/**
 * Retrieve a live session. Returns null if missing or expired.
 */
export const getSession = (sessionId) => {
  const session = store.get(sessionId);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    store.delete(sessionId);
    return null;
  }
  return session;
};

/**
 * Explicitly clear a session (called on guest logout if needed).
 */
export const clearSession = (sessionId) => {
  store.delete(sessionId);
};

// Auto-purge expired sessions every 10 minutes so memory doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of store) {
    if (now > data.expiresAt) store.delete(id);
  }
}, 10 * 60 * 1000);
