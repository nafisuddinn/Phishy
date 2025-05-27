# Phishy 🐟

# removed the "AI", keep it clean like "Facebook"

**Detect and explain scam messages using Gemini AI + FastAPI + React**

---

## 🚀 Demo
[Live Demo Link] (once deployed)

---

## 🔍 What It Does

Phishy AI analyzes any message (e.g. Instagram DM, SMS, or email) and tells you:
- ✅ Whether it’s likely a scam
- 🧠 The type of scam (phishing, impersonation, etc.)
- 📊 A confidence score from 0–100%
- 📄 A short explanation of why it’s flagged

---

## 🛠 Tech Stack

- 🧠 Google Gemini API — for natural language scam detection
- ⚙️ FastAPI — lightweight Python backend
- ⚛️ React (Vite) — responsive frontend
- 🗃️ DynamoDB - AWS Cloud service to serve as a fast lightweight logging system
- 🌐 Render — backend deployment
- ✨ (Planned) Messenger API for Instagram (Meta integration)

---

## 🧪 How to Use

1. Clone the repo
2. Add your Gemini API key to `.env`
3. Run the backend:
   ```bash
   uvicorn main:app --reload
4. Run the front end
    ```bash
   cd phishy-ai-frontend
    npm install
    npm run dev

