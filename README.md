# GaonWala — AI-Powered Farm-to-Table E-Commerce Platform

GaonWala is a full-stack MERN application that enables farmers to sell fresh produce directly to customers online, with an AI sales assistant, secure payment integration, and a complete admin panel.

---

## About the Developer

**Harshal Argade** — Full-Stack MERN Developer

[![LinkedIn](https://img.shields.io/badge/LinkedIn-%230077B5.svg?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/harshal-argade-dev/)
&nbsp;
[![Gmail](https://img.shields.io/badge/Gmail-D14836?logo=gmail&logoColor=white)](mailto:harshalargade.dev@gmail.com)

---

## What This Project Does

- Customers browse produce by category, verify their phone via OTP, choose a payment method, and place an order
- An AI assistant answers natural language queries and recommends in-stock products
- Admins manage products, view orders, and update delivery status through a protected dashboard
- A Guest Admin mode lets anyone explore the admin panel without touching real data

---

## Key Features

- **AI Sales Assistant** — Powered by Google Gemini API with a RAG-inspired architecture. Products are embedded as 3072-dimensional vectors and stored in MongoDB Atlas. A structured prompt with few-shot examples and behavioral constraints ensures the assistant only recommends real, in-stock products — not hallucinated ones.
- **Razorpay Payment Gateway** — Supports UPI, Cards, Wallets, Netbanking, and Cash on Delivery. Every online payment is verified server-side using HMAC-SHA256 signature before the order is created.
- **Firebase OTP Verification** — Customers verify their phone number before checkout. Firebase handles rate limiting, OTP expiry, and retry logic.
- **Twilio Notifications** — WhatsApp and SMS order confirmations sent asynchronously after order placement and on status updates, without blocking the order response.
- **Guest Admin Sandbox** — A 30-minute JWT guest session with all changes isolated in-memory. Nothing written to the database.
- **URL-based Category Routing** — Each category has a shareable URL (`/fruit`, `/vegetable`, `/seeds`). Logo click returns to all products.
- **Order Management** — Admin can view all orders and move them through Pending → Confirmed → Delivered → Cancelled, triggering a customer notification on each update.
- **Stock Management** — Stock is validated before order creation and decremented atomically. Out-of-stock products are flagged in the UI.
- **Performance** — Code splitting, React lazy loading, `fetchPriority` on above-fold images, and preconnect hints applied based on Lighthouse audit results.

---

## Tech Stack

**Frontend** — React 19, Vite, React Router DOM, Axios, React Icons

**Backend** — Node.js, Express, MongoDB Atlas, Mongoose, JWT, bcryptjs, Multer, Razorpay SDK, Twilio

**AI** — Google Gemini API (`gemini-2.5-flash`, `gemini-embedding-001`), Vector Embeddings, Prompt Engineering

**Auth & Payments** — Firebase Auth (Phone OTP), Razorpay, HMAC-SHA256 verification

**Tools** — Git, GitHub, MongoDB Atlas, Cloudinary, dotenv

---

## Project Structure

```
gaon-wala/
├── src/
│   ├── Banner/           # Navbar — logo, search, cart icon
│   ├── Cart/             # Cart popup, checkout flow, OTP, payment
│   ├── Components/       # AdminDashboard, AdminLogin, AIChatWidget
│   ├── Icons/            # Category icon grid with active state
│   ├── Products/         # Product listing and card components
│   ├── Top_Scroll/       # Announcement ticker
│   ├── constants/        # Category slug mappings
│   ├── firebase.js       # Firebase app initialisation
│   ├── config.js         # API base URL
│   └── App.jsx           # Root component and routing
│
├── backend/
│   ├── Controllers/      # Route handlers
│   ├── Middlewares/      # JWT auth middleware
│   ├── Models/           # Mongoose schemas (Product, Order, Admin)
│   ├── Routes/           # API route definitions
│   ├── utils/            # sandboxStore, notificationService, promptTemplates
│   ├── vectorize.js      # Product embedding script
│   ├── .env.example      # Environment variable reference
│   └── server.js         # Express entry point
│
├── index.html
├── vite.config.js        # Build config with manual chunk splitting
└── README.md
```

---

## Security Notes

- `.env` is excluded from Git via `.gitignore`
- Razorpay payments verified server-side before any order is written to the database
- Firebase handles OTP rate limiting and expiry — not custom-built
- Guest sessions are fully in-memory and never interact with MongoDB
- No credentials are hardcoded anywhere in the codebase

---

## Screenshots

### Home Page
<!-- Add screenshot -->

### AI Assistant
<!-- Add screenshot -->

### Phone OTP Verification
<!-- Add screenshot -->

### Cart & Checkout
<!-- Add screenshot -->

### Payment Method Selection
<!-- Add screenshot -->

### Razorpay Gateway
<!-- Add screenshot -->

### Admin Login & Guest Sandbox
<!-- Add screenshot -->

### Admin Dashboard
<!-- Add screenshot -->

### Order Management
<!-- Add screenshot -->

---

## Running Locally

```bash
# Clone
git clone https://github.com/harshal14001/Gaon-Wala.git

# Frontend
npm install
npm run dev

# Backend
cd backend
npm install
cp .env.example .env   # fill in your credentials
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:5000`

---

## License

This project is part of my personal portfolio. The source code is visible for evaluation purposes. Please do not copy or redistribute it.
