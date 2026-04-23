---

# 🌾 GaonWala — AI-Powered Farm-to-Table E-Commerce Platform

GaonWala is a full-stack e-commerce platform built to help farmers sell fresh produce directly to customers online — with an AI assistant, secure payments, and a powerful admin panel.

---

## 👨‍💻 About the Developer

Hi, I'm **Harshal Argade** 👋

Full-Stack MERN Developer passionate about building scalable apps and solving real-world problems using modern web technologies and AI.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-%230077B5.svg?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/harshal-argade-dev/)
&nbsp;
[![Gmail](https://img.shields.io/badge/Gmail-D14836?logo=gmail&logoColor=white)](mailto:harshalargade.dev@gmail.com)

---

## 📋 Project Details

- Built a full-stack e-commerce platform enabling farmers to list and sell fresh produce online with dynamic product management.
- Engineered a **context-aware AI Sales Assistant** using Google Gemini API and **RAG (Retrieval-Augmented Generation)** — answers nutritional queries and recommends in-stock products in real-time using vector similarity search.
- Implemented **URL-based category filtering** using React Router — every category has a shareable URL (`/fruit`, `/vegetable`, etc.) and the logo navigates back to all products.
- Built a **Guest Admin Sandbox** — visitors can explore the admin panel with a 30-minute JWT session; all changes are isolated in-memory and never touch the real database.
- Integrated **Razorpay Payment Gateway** with full signature verification — supports UPI, Cards, Wallets, Netbanking, and Cash on Delivery.
- Implemented secure **JWT-based authentication** for admin access with role-based routing (Admin vs Guest).
- Built a full **Order Management System** — customers place orders with delivery details, admin can view all orders and update statuses (Pending → Confirmed → Delivered → Cancelled).
- Applied **Lighthouse performance optimizations** — code splitting, React lazy loading, image lazy loading with `fetchPriority`, and preconnect hints — improving LCP and TTI significantly.
- Integrated **Cloudinary** for image uploads and **MongoDB Atlas** for cloud database with vector embedding support.

---

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
| Razorpay | UPI, Cards, Wallet, Netbanking, EMI |
| HMAC-SHA256 Signature Verification | Prevents payment fraud |
| JWT Tokens | Admin & Guest session management |

### DevOps & Tools
| Technology | Purpose |
|---|---|
| MongoDB Atlas | Cloud database with vector search |
| Cloudinary | Image storage & CDN |
| Git + GitHub | Version control |

---

## ✨ Key Features

- 🤖 **AI Sales Assistant** — Context-aware chatbot with RAG, recommends products and answers queries with proper validation not like the post you saw over internet, where customer asks for script to reverse a linkedlist.
- 🔐 **Admin Panel** — Full CRUD for products, order management, status updates
- 🎭 **Guest Admin Sandbox** — Explore admin features without affecting real data
- 💳 **Razorpay Integration** — Secure online payments with signature verification
- 💵 **Cash on Delivery** — Alternative payment option
- 🗂️ **URL-based Category Filtering** — Shareable `/fruit`, `/vegetable`, `/seeds` routes
- 🔍 **Product Search** — Search by name or category in the admin panel
- 📦 **Stock Management** — Real-time stock tracking, auto-deduction on orders
- 📱 **Responsive Design** — Optimized for mobile and desktop
- ⚡ **Performance Optimized** — Code splitting, lazy loading, preconnect hints

---

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

### Category Filtering
<!-- Add screenshot -->

### Cart & Checkout
<!-- Add screenshot -->

### Payment — Choose Method
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
├── src/                        # React frontend
│   ├── Banner/                 # Navbar with logo, search, cart
│   ├── Cart/                   # Cart popup & checkout flow
│   ├── Components/             # AdminDashboard, AdminLogin, AIChatWidget
│   ├── Icons/                  # Category icon grid
│   ├── Products/               # Product listing cards
│   ├── Top_Scroll/             # Announcement ticker
│   ├── constants/              # Category slug mappings
│   ├── config.js               # API base URL
│   └── App.jsx                 # Root component & routing
│
├── backend/
│   ├── Controllers/            # Route handlers
│   ├── Middlewares/            # Auth middleware (JWT)
│   ├── Models/                 # Mongoose schemas
│   ├── Routes/                 # API route definitions
│   ├── utils/                  # Sandbox store, helpers
│   ├── .env.example            # Environment variable template
│   └── server.js               # Express app entry point
│
├── index.html                  # HTML entry point
├── vite.config.js              # Vite + code splitting config
└── README.md
```

---

## 🔐 Security

- `.env` excluded from Git via `.gitignore`
- Razorpay payments verified using HMAC-SHA256 signature on backend
- JWT tokens expire after set duration
- Guest sessions are fully isolated in-memory — never touch the database
- No credentials hardcoded in source code

---

## 📄 License

I can't say this project is open source and available under the [MIT License](LICENSE), because project is not developed for sharing with someone else.
