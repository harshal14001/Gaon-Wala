---

# 🌾 GaonWala — AI-Powered E-Commerce Platform

GaonWala is a full-stack e-commerce platform built to help farmers sell fresh produce directly to customers online — with an AI assistant, secure payments, and a powerful admin panel.

---

## 👨‍💻 About the Developer

Hi, I'm **Harshal Argade** 👋

Full-Stack MERN Developer passionate about building scalable apps and solving real-world problems using modern web technologies and AI.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-%230077B5.svg?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/harshal-argade-dev/)
&nbsp;
[![Gmail](https://img.shields.io/badge/Gmail-D14836?logo=gmail&logoColor=white)](mailto:harshalargade.dev@gmail.com)

---

## What This Project Does

- Customers browse produce by category, verify their phone via OTP, choose a payment method, and place an order.
- An AI assistant answers natural language queries and recommends in-stock products.
- Admins manage products, view orders, and update delivery status through a protected dashboard.
- A Guest Admin mode lets anyone explore the admin panel without touching real data.

---

## Key Features

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

### Environment Setup

```bash
# In the backend/ directory, create your .env file
cp .env.example .env
# Fill in your credentials (see .env.example for reference)
```

### Run the App

```bash
# Start backend (from /backend)
npm run dev

# Start frontend (from root)
npm run dev
```

Frontend runs on `http://localhost:5173`  
Backend runs on `http://localhost:5000`

---

## 📸 Screenshots

### Home Page
<!-- Add screenshot -->

### AI Assistant
<!-- Add screenshot -->

### Phone OTP Verification
<!-- Add screenshot -->

### Category Filtering
<!-- Add screenshot -->

### Cart & Checkout
<!-- Add screenshot -->

### Payment Gateway
<!-- Add screenshot -->

### Razorpay Payment Gateway
<!-- Add screenshot -->

### Admin Login & Guest Sandbox
<!-- Add screenshot -->

### Admin Dashboard — Add Products
<!-- Add screenshot -->

### Admin Dashboard — Edit / Delete Products
<!-- Add screenshot -->

### Order Management
<!-- Add screenshot -->

---

## 📁 Project Structure

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

## 🔐 Security

- `.env` excluded from Git via `.gitignore`
- Razorpay payments verified server-side before any order is written to the database.
- JWT tokens expire after set duration
- Guest sessions are fully in-memory and never interact with MongoDB.
- No credentials are hardcoded anywhere in the codebase.

---

## 📄 License

I can't say this project is open source and available under the [MIT License](LICENSE), because project is not developed for sharing with someone else.
