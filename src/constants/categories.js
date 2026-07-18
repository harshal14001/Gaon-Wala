// src/constants/categories.js
// Single source of truth for category ↔ URL slug mapping.
// Used by Icons (links) and App (reading URL param).

export const SLUG_TO_CATEGORY = {
  fruit:           "Fruit",
  vegetable:       "Vegetable",
  "milk-products": "Milk Products",
  plants:          "Plants",
  seeds:           "Seeds",
  other:           "Other",
};

// Reverse map: DB value → slug  e.g. "Milk Products" → "milk-products"
export const CATEGORY_TO_SLUG = Object.fromEntries(
  Object.entries(SLUG_TO_CATEGORY).map(([slug, cat]) => [cat, slug])
);
