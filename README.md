# 🖥️ Freelance MarketPlace — Server API  
> RESTful backend for the full-stack freelance job platform. Built with **Node.js, Express.js, and MongoDB Atlas**, with Firebase Auth integration.

[![API Status](https://img.shields.io/badge/API_Status-Online-brightgreen?logo=vercel)](https://freelance-api.vercel.app)
[![Client App](https://img.shields.io/badge/Frontend-Netlify-00C7B7?logo=netlify)](https://freelancehub.netlify.app)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

🔗 **Live API**: [https://freelance-server-ivory.vercel.app/](https://freelance-server-ivory.vercel.app/)  


---

## 🌐 API Overview

A secure, scalable backend supporting:
- ✅ Job CRUD operations (with ownership validation)
- ✅ Firebase ID token authentication middleware
- ✅ Acceptance workflow (`/accept-job`)
- ✅ Protected routes for private actions
- ✅ Environment-based configuration (`.env`)

Inspired by backend patterns from **[ThemeForest](https://themeforest.net/)** (robust, modular architecture) and security best practices from **[uiverse.io](https://uiverse.io/)**.

---

## 🚀 Key Features

- 🔐 **Firebase Auth Integration**  
  Middleware verifies `Authorization: Bearer <idToken>` using Firebase Admin SDK — no session storage, no JWT reinvention.

- 📦 **Job Data Model (MongoDB)**  
  ```js
  {
    title: String,
    postedBy: String,     
    category: String,
    summary: String,
    coverImage: String,   
    userEmail: String,    
    acceptedBy: [String], 
    createdAt: Date
  }
