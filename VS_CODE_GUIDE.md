# 🇮🇳 Bharat Darshan - Full-Stack Production & VS Code Guide

Welcome! This guide explains how to run, customize, and deploy this project in **VS Code**, **Cursor**, **AntiGravity**, and for public production hosting.

---

## 🏗️ 1. Architecture

| Component | Technology | File Location | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | HTML5, CSS (Tailwind), React, TypeScript/JS | `src/` | Interactive Responsive Web UI, Maps, Audio Guide, 36 States, Filters |
| **Backend** | Python 3 + Flask REST API | `backend/app.py` | API Endpoints & Business Logic |
| **Database** | SQLite3 (`bharat_darshan.db`) | `backend/database.py` | Stores User Name & Login Timestamp in `users` table |
| **Fullstack Dev Server** | Express + Vite Proxy | `server.ts` | Seamless unified runner for Cloud & Local development |

---

## 🚀 2. How to Open and Run in VS Code / Cursor

### Step 1: Open in VS Code
1. Open **VS Code**.
2. Click **File -> Open Folder** and select the project folder.

### Step 2: Running the Project
You have two simple ways to run it:

#### **Method A: The 1-Command Unified Run (Recommended)**
Open the VS Code Terminal (`Ctrl + ~` or `Cmd + ~`) and type:
```bash
npm install
npm run dev
```
👉 Open your browser at **`http://localhost:3000`**. The entire portal, interactive maps, audio narration, and database are live!

#### **Method B: Running Python Flask API Directly (To show judges)**
Open a terminal in VS Code:
```bash
cd backend
pip install -r requirements.txt
python app.py
```
👉 Your Python Flask API will start running at **`http://localhost:5000`** with SQLite connected!

---

## 🗄️ 3. How the Database Works (User Name & Login Time)

As requested, the database specifically records **User Name** and **Login Timestamp**:

### Database Schema:
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    login_time TEXT NOT NULL
);
```

### How to See Database Records in VS Code:
1. In VS Code, go to the Extensions tab (`Ctrl + Shift + X`).
2. Search and install **"SQLite Viewer"** (by Florian Klampfer).
3. In the file explorer, click on `backend/bharat_darshan.db`.
4. You will see the entire live table with columns: `id`, `name`, `login_time`!

### How to Check Records from Terminal:
Run:
```bash
python backend/database.py
```
Or query using Python:
```bash
python -c "import sys; sys.path.append('backend'); from database import get_all_users; print(get_all_users())"
```

---

## 🎯 4. Quick Customization Cheatsheet

If you need to make changes or live updates on the fly, here are the exact files to edit:

| Customization Task | File to Open | What to Change |
| :--- | :--- | :--- |
| **"Change the app title or branding"** | `src/components/BrandLogo.tsx` | Line 10: Change the English or Hindi brand text |
| **"Add or modify a State"** | `src/data/allStatesData.ts` | Add or update a state object (name, capital, overview) |
| **"Add or modify a Heritage Monument"** | `src/data/allStatesHeritage.ts` | Add new monument object (title, history, image, lat/lng) |
| **"Change User Database fields"** | `backend/database.py` | Add columns to `CREATE TABLE users` (e.g. `city TEXT`) |
| **"Change Navigation links or buttons"** | `src/components/Navbar.tsx` | Modify nav items or buttons |
| **"Change colors or theme"** | `src/index.css` | Edit color values (e.g. Terracotta `#8B2E24`, Deep Ochre `#D97706`) |

---

## 🌐 5. How to Deploy & Make it Public on Google

When you qualify and need to deploy it online for public access:

### Option 1: Vercel / Netlify (Frontend + Offline Database)
1. Push your code to GitHub.
2. Go to **vercel.com** or **netlify.com**.
3. Import your GitHub repository.
4. Set Build Command: `npm run build`
5. Set Output Directory: `dist`
6. Click **Deploy**! You will get a free public HTTPS link (e.g., `https://bharat-darshan.vercel.app`).

### Option 2: Render.com / Railway (Full Python Flask + SQLite Backend)
1. In Render, select **Web Service**.
2. Connect your GitHub repo.
3. Build Command: `pip install -r backend/requirements.txt`
4. Start Command: `python backend/app.py`
5. Your Python API will be live globally on Google Cloud / AWS!
