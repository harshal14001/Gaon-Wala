# GaonWala — AI-Powered Farm-to-Table E-Commerce Platform

<<<<<<< HEAD
GaonWala is a full-stack MERN application that enables farmers to sell fresh produce directly to customers online, with an AI sales assistant, secure payment integration, and a complete admin panel.
=======
# 🌾 GaonWala — AI-Powered E-Commerce Platform

GaonWala is a full-stack e-commerce platform built to help farmers sell fresh produce directly to customers online — with an AI assistant, secure payments, and a powerful admin panel.
>>>>>>> 

---

## About the Developer

**Harshal Argade** — Full-Stack MERN Developer

[![LinkedIn](https://img.shields.io/badge/LinkedIn-%230077B5.svg?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/harshal-argade-dev/)
&nbsp;
[![Gmail](https://img.shields.io/badge/Gmail-D14836?logo=gmail&logoColor=white)](mailto:harshalargade.dev@gmail.com)

---

## What This Project Does

<<<<<<< HEAD
- Customers browse produce by category, verify their phone via OTP, choose a payment method, and place an order
- An AI assistant answers natural language queries and recommends in-stock products
- Admins manage products, view orders, and update delivery status through a protected dashboard
- A Guest Admin mode lets anyone explore the admin panel without touching real data
=======
- Customers browse produce by category, verify their phone via OTP, choose a payment method, and place an order.
- An AI assistant answers natural language queries and recommends in-stock products.
- Admins manage products, view orders, and update delivery status through a protected dashboard.
- A Guest Admin mode lets anyone explore the admin panel without touching real data.

---

## Key Features
<<<<<<< HEAD

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
=======

- AI Sales Assistant — Powered by Google Gemini API with a RAG-inspired architecture. Products are embedded as 3072-dimensional vectors and stored in MongoDB Atlas. A structured prompt with few-shot examples and behavioral constraints ensures the assistant only recommends real, in-stock products — not hallucinated ones.
- Razorpay Payment Gateway — Supports UPI, Cards, Wallets, Netbanking, and Cash on Delivery. Every online payment is verified server-side using HMAC-SHA256 signature before the order is created.
- Firebase OTP Verification — Customers verify their phone number before checkout. Firebase handles rate limiting, OTP expiry, and retry logic.
- Twilio Notifications — WhatsApp and SMS order confirmations sent asynchronously after order placement and on status updates, without blocking the order response.
- Guest Admin Sandbox — A 10-minute JWT guest session with all changes isolated in-memory. Nothing written to the database.
- URL-based Category Routing — Each category has a shareable URL (/fruit, /vegetable, /seeds). Logo click returns to all products.
- Order Management — Admin can view all orders and move them through Pending → Confirmed → Delivered → Cancelled, triggering a customer notification on each update.
- Stock Management — Stock is validated before order creation and decremented atomically. Out-of-stock products are flagged in the UI.
- Performance — Code splitting, React lazy loading, fetchPriority on above-fold images, and preconnect hints applied based on Lighthouse audit results.

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite 6 | Build tool & dev server |
| React Router DOM 7 | Client-side routing & URL-based filtering |
| Axios | HTTP client |
| React Icons | Icon library |
| CSS Modules | Component-scoped styling |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Express 5 | REST API framework |
| MongoDB + Mongoose | Database & ODM |
| JWT (jsonwebtoken) | Authentication & session management |
| bcryptjs | Password hashing |
| Multer | File/image upload handling |
| Razorpay SDK | Payment gateway integration |
| dotenv | Environment variable management |
| Nodemon | Development hot-reload |

### AI & Intelligence
| Technology | Purpose |
|---|---|
| Google Gemini API (`@google/generative-ai`) | Generative AI for the sales assistant |
| RAG (Retrieval-Augmented Generation) | Grounds AI responses in real product data |
| Vector Embeddings | Similarity search for product recommendations |
| Prompt Engineering | Context injection for accurate, relevant responses |

### Payments & Security
| Technology | Purpose |
|---|---|
| Twillo | Transactional Communication (Custom SMS/WhatsApp)|
| Firebase Auth | Identity Verification (Phone No) via OTP |
| Razorpay | UPI, Cards, Wallet, Netbanking, EMI |
| HMAC-SHA256 Signature Verification | Prevents payment fraud |
| JWT Tokens | Admin & Guest session management |

### DevOps & Tools
| Technology | Purpose |
|---|---|
| MongoDB Atlas | Cloud database with vector search |
| Cloudinary | Image storage & CDN |
| Git + GitHub | Version control |

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Razorpay account (test keys for development)
- Google Gemini API key

### Installation

```bash
# Clone the repository
# However this is my personal project and not ment to share source code with someone else.

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
<img width="1917" height="870" alt="Image" src="https://github.com/user-attachments/assets/5265f5b8-c44c-4891-a9b0-9a2d73f68862" />

### AI Assistant
<img width="1907" height="872" alt="Image" src="https://github.com/user-attachments/assets/6b88aa3f-4589-4208-849a-65988bf49c4d" />
&nbsp;
&nbsp;
<img width="1917" height="866" alt="Image" src="https://github.com/user-attachments/assets/4b54e211-0249-4b2e-bc95-bde336b7e594" />

### Phone OTP Verification
<img width="1917" height="870" alt="Image" src="https://github.com/user-attachments/assets/e2d2ecb5-e36c-49aa-a47b-2529af9c5a8c" />
&nbsp;
&nbsp;
<img width="720" height="1600" alt="Image" src="https://github.com/user-attachments/assets/85ff16b2-3870-4130-aa24-f27701375c1c" />

<<<<<<< HEAD
### Phone OTP Verification
<!-- Add screenshot -->
=======
### Category Filtering
<img width="1917" height="867" alt="Image" src="https://github.com/user-attachments/assets/2be7aaf0-3618-4d8c-b31d-6f56f02ae604" />

### Cart & Checkout
<img width="1917" height="867" alt="Image" src="https://github.com/user-attachments/assets/bbaa06bb-9a54-43ea-bb9f-4c88b925d414" />
&nbsp;
&nbsp;

<<<<<<< HEAD
### Payment Method Selection
<!-- Add screenshot -->

### Razorpay Gateway
<!-- Add screenshot -->
=======
### Payment Gateway
<img width="1917" height="865" alt="Image" src="https://github.com/user-attachments/assets/d84cfd00-0ab8-4ee6-a0c1-6c7442f354b8" />

### Razorpay Payment Gateway
<img width="1917" height="870" alt="Image" src="https://github.com/user-attachments/assets/df7910a2-2c3d-4fc9-9659-502dd0c8f6b6" />

### Admin Login & Guest Sandbox
<img width="1917" height="867" alt="Image" src="https://github.com/user-attachments/assets/c48598de-d1ee-4d56-a972-28ab7ad8ecaa" />

<<<<<<< HEAD
### Admin Dashboard
<!-- Add screenshot -->
=======
### Admin Dashboard — Add Products
<img width="1918" height="866" alt="Image" src="https://github.com/user-attachments/assets/1af243e7-29f0-4e3b-ac10-4d518c8aff80" />

### Admin Dashboard — Edit / Delete Products
<img width="1917" height="867" alt="Image" src="https://github.com/user-attachments/assets/1852951a-f70f-4e4d-9140-0fe14b2ee515" />

### Order Management
<img width="1917" height="862" alt="Image" src="https://github.com/user-attachments/assets/b8988c65-a576-4f39-afa2-f805884d09dd" />
&nbsp;
&nbsp;

<img width="1917" height="1022" alt="Image" src="https://github.com/user-attachments/assets/7b45b7b3-5999-4628-bd9f-3c9d3194e615" />

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
<<<<<<< HEAD

Frontend: `http://localhost:5173`
Backend: `http://localhost:5000`
=======
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
>>>>>>> 0e8ac2c6f06dcb1dc056778e8c5f1f08eff0b69f

---

## License

<<<<<<< HEAD
This project is part of my personal portfolio. The source code is visible for evaluation purposes. Please do not copy or redistribute it.
=======
- `.env` excluded from Git via `.gitignore`
- Razorpay payments verified server-side before any order is written to the database.
- JWT tokens expire after set duration
- Guest sessions are fully in-memory and never interact with MongoDB.
- No credentials are hardcoded anywhere in the codebase.

---

## 📄 License

I can't say this project is open source and available under the [MIT License](LICENSE), because project is not developed for sharing with someone else.
>>>>>>> 0e8ac2c6f06dcb1dc056778e8c5f1f08eff0b69f
