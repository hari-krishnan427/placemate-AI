# 🚀 PlaceMate AI — Intelligent Career & Placement Platform

> **Grounded in Verified Resumes, Live Market Circulars, and Conversational AI Coaching.**

PlaceMate AI is a full-stack, enterprise-grade placement preparation and career intelligence platform designed for engineering and degree candidates. It bridges the gap between campus credentials and real-world hiring by unifying document parsing, real-time job/internship matching, official government exam circulars, and AI-powered voice interview simulations.

---

## ✨ Key Features

- 📁 **Universal Document Vault**: Securely parse and audit resumes, academic marksheets, degree certificates, and ID proofs using local high-speed text extraction & OCR.
- 🎯 **Real-Time Job & Internship Radar**: Matches candidate profiles against active opportunities using an adaptive skills-and-CGPA weighting engine.
- 🏛️ **Government Exam Engine**: Dynamic eligibility checking and syllabus breakdown for UPSC, SSC, RRB, Police Recruitment, Banking, and State Public Service Boards.
- 🎙️ **AI Voice Mentor ("Coach Ananya")**: Conversational senior placement coach that conducts simulated mock interviews, offers vocal encouragement, and generates detailed round-by-round scorecards.
- 🤖 **Interactive Career AI Copilot**: Real-time resume-grounded chatbot answering questions on company patterns, interview rounds, and launching instant timed mock tests.
- ⚡ **Placement Survival Radar**: Web circular scanner alerting students to 24-hour flash hiring deadlines with direct email notification support.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Vanilla CSS (Modern SaaS Light Design System)
- **Backend**: Node.js, Express 5, Multer, Nodemailer, Cheerio, PDF-Parse, Mammoth, Tesseract.js
- **Database**: PostgreSQL with connection pooling & `connect-pg-simple` durable session storage
- **AI Core**: Google Gemini 2.5 Flash API with custom prompt engineering & grounding
- **Security**: Bcrypt password hashing, session cookies with HTTPS cross-site support, CORS isolation

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- Google Gemini API Key

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your DATABASE_URL, GEMINI_API_KEY, and SESSION_SECRET in .env
npm start
```
*Backend runs on `http://localhost:3000` (Health check at `http://localhost:3000/health`).*

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🌐 Production Deployment

Refer to [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) for 1-click deployment instructions on **Vercel** (Frontend) + **Render / Railway** (Backend) + **Neon / Supabase** (PostgreSQL).

---

## 📄 License
ISC © 2026 PlaceMate AI
