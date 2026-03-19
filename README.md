# Phishy 🐟

# **Detect and explain scam messages using Gemini AI + DynamoDB + FastAPI + React**


Removed the "AI", kept it clean like "Facebook"

SCALE 2 (My way of saying "version" but in fish terms)

---

## 🚀 Demo
[https://phishy-liart.vercel.app/] 

---

## 🔍 What It Does

Phishy AI analyzes any message (e.g. Instagram DM, SMS, or email) and tells you:
- ✅ Whether it’s likely a scam
- 🧠 The type of scam (phishing, impersonation, etc.)
- 📊 A confidence score from 0–100%
- 📄 A short explanation of why it’s flagged
- 📜 Shows the user's history of analyzed messages
- 🌐 Community threat feeds, shows the latest scams happening now!
- 🗺️ Heatmap to show the concentration of scams occurring in specific areas

---

## 🛠 Tech Stack

- 🧠 **Google Gemini API** — for natural language scam detection
- ⚙️ **FastAPI** — lightweight Python backend
- 🍃 **Leaflet API** - JavaScript library for interactive maps
- ⚛️ **React (Vite)** — responsive frontend
- 🗃️ **DynamoDB** - AWS Cloud service to serve as a fast lightweight logging system
- 🌐 **Render** — backend deployment
- 💻 **Vercel** - frontend deployment
- ✨ **(Planned)** Messenger API for Instagram (Meta integration)

---

## 🧪 How to Use

1. Clone the repo
2. Add your Gemini API key to `.env`
3. Run the backend:
   ```bash
   uvicorn main:app --reload
4. Run the frontend
    ```bash
   cd phishy-ai-frontend
    npm install
    npm run dev

