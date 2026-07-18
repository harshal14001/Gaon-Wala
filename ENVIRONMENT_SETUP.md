# 🔐 Environment Setup Guide

## **CRITICAL: Never commit `.env` files to GitHub**

---

## Setup Instructions

### 1. **Create your local `.env` file**

In `backend/` directory, create a file named `.env` (copy from `.env.example`):

```bash
cd backend
cp .env.example .env
```

### 2. **Fill in your credentials**

Edit `backend/.env` and replace the placeholders with your actual values:

```env
MONGO_URI=mongodb://localhost:27017/gaonwala
PORT=5000
JWT_SECRET=your-super-secret-key-12345
ADMIN_EMAIL=admin@gaonwala.com
ADMIN_PASSWORD=yourpassword
GEMINI_API_KEY=your_gemini_key_here
RAZORPAY_KEY_ID=rzp_test_YourTestKeyHere    # Test or Live key
RAZORPAY_KEY_SECRET=YourSecretKeyHere       # Never share this!
```

---

## ✅ Security Checklist

- [ ] **`.env` is in `.gitignore`** — Don't commit it
- [ ] **`.env.example` is in Git** — Only example with placeholders
- [ ] **No credentials in code** — Keep them only in `.env`
- [ ] **No credentials in documentation** — Never hardcode them
- [ ] **GitHub doesn't have your secrets** — Verify with `git log --all --full-history -- .env`

---

## If You Accidentally Committed `.env`

### ⚠️ **DANGER: Your credentials are exposed**

1. **Immediately rotate your keys** in Razorpay, MongoDB, Gemini dashboards
2. **Remove from Git history** (permanently):

```bash
git filter-branch --tree-filter 'rm -f .env' HEAD
# OR use git-filter-repo (faster):
git filter-repo --invert-paths --path .env
```

3. **Force push** (careful!):
```bash
git push --force-with-lease
```

4. **Create new credentials** in each service

---

## Environment Variables Explained

| Variable | Purpose | Example |
|---|---|---|
| `MONGO_URI` | Database connection | `mongodb://localhost:27017/gaonwala` |
| `PORT` | Server port | `5000` |
| `JWT_SECRET` | Token signing key | `abc123xyz...` |
| `ADMIN_EMAIL` | First admin email | `admin@gaonwala.com` |
| `ADMIN_PASSWORD` | First admin password | `SecurePass123!` |
| `GEMINI_API_KEY` | Google AI API key | Get from Google Cloud |
| `RAZORPAY_KEY_ID` | Payment gateway ID | `rzp_test_...` or `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Payment gateway secret | **KEEP THIS SECRET** |

---

## For Your Team

Share only:
- ✅ **`.env.example`** — uploaded to GitHub
- ❌ **NOT `.env`** — keep locally only

When a team member clones:
```bash
git clone https://github.com/yourusername/gaonwala.git
cd gaonwala/backend
cp .env.example .env
# They fill in their own values
```

---

## Production Deployment

When deploying to production (Heroku, AWS, etc.):

**NEVER** commit `.env`. Instead:

1. **Set environment variables** in the deployment platform:
   - Heroku: `heroku config:set KEY=value`
   - AWS: Use Secrets Manager
   - Vercel/Netlify: Use environment variables dashboard

2. **Or use a secrets management service:**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Doppler

3. **Your app reads from the environment**, not from `.env`

---

**Remember:** Even test credentials should be treated as secrets!
