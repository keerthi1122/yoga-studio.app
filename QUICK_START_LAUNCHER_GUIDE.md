# Yoga Studio Admin Dashboard — Instant Access & Deployment Guide

This guide explains how to instantly access, run, live-edit, and temporarily/permanently deploy the **Yoga Studio Admin Dashboard** on Windows without needing an AI agent or manual terminal commands.

---

## 🚀 1-Click Launch Options (Instant Access)

The root folder contains pre-configured 1-click launchers that require zero setup:

| File | Mode | Description |
|---|---|---|
| **`create_desktop_shortcut.bat`** | **Desktop Setup** | Double-click once to create **"Yoga Studio (Start)"** and **"Yoga Studio (Stop)"** icons directly on your Windows Desktop for instant access! |
| **`start_app.vbs`** | **Silent Background** *(Recommended)* | Double-click to start the dev server silently in the background. It dynamically polls the server socket and opens your browser to `https://localhost:5173/` the exact millisecond it is ready (no black CMD window stays open, no duplicate tabs). |
| **`start_app.bat`** | **Interactive Console** | Double-click to start the dev server in a console window showing live Vite compilation and Hot-Module Reloading (HMR) logs, while automatically opening `https://localhost:5173/`. |
| **`stop_app.bat`** | **1-Click Stop** | Double-click to cleanly terminate all dev and preview servers and release ports 5173, 4173, and 5000. |
| **`stop_app.vbs`** | **Silent Stop** | Terminates all running servers silently without any console popup. |

---

## ⚡ Live Code Editing & Instant Reloading

When the app is running via `start_app.vbs` or `start_app.bat`:
1. Open the project in your favorite code editor (VS Code, Cursor, etc.).
2. Navigate to `admin_dashboard/src/`.
3. Edit any React component, page, or style (e.g., `src/pages/Dashboard.tsx`).
4. Save the file (`Ctrl + S`).
5. **The browser reloads automatically within milliseconds** (Vite Hot Module Replacement — HMR). You never need to restart the server when making changes!

---

## 🌐 Production Preview & Temporary Local/LAN Server

If you want to test the optimized production build locally or share it across your local Wi-Fi with mobile devices or other computers:

| File | Description |
|---|---|
| **`start_preview.bat`** | Automatically builds the production bundle (`tsc && vite build`) and starts the zero-dependency persistent server on `http://localhost:4173/`. Also displays your local network IP (e.g., `http://192.168.x.x:4173/`) so you can open it on your phone or tablet on the same Wi-Fi! |
| **`start_preview.vbs`** | Silent version of the production preview server. |

---

## ☁️ Cloud & Temporary Web Deployment (`deploy_firebase.bat`)

Double-click **`deploy_firebase.bat`** to access an interactive deployment menu:

### Option 1: Temporary Firebase Preview Channel (Expires in 7 days)
- Generates an on-demand temporary preview URL:
  ```
  https://gvya-yoga-f3c9f--preview-XXXXXX.web.app
  ```
- *This URL works from anywhere in the world and automatically expires after 7 days.*

### Option 2: Live Production Firebase Hosting
- Updates the permanent production website:
  ```
  https://gvya-yoga-f3c9f.web.app
  https://gvya-yoga-f3c9f.firebaseapp.com
  ```

### Option 3: Instant Public Web Tunnel (Zero Signup)
- Uses Cloudflare Quick Tunnel (`npx cloudflared tunnel --url https://localhost:5173`) to instantly expose your local live dev server to the internet via a temporary HTTPS link.
- Supports live hot-reloading while sharing with remote users!

### Option 4: Local / LAN Persistent Server
- Starts the standalone production server on port 4173.

---

## 🛡️ Port Conflict Prevention & Graceful Shutdown

- If you run `start_app.bat` or `start_app.vbs` while the server is already running, it **detects the existing instance** and simply opens your browser to `https://localhost:5173/` without starting a duplicate process or opening multiple tabs.
- Running `stop_app.bat` safely sends a graceful shutdown signal (`/__shutdown`) to Vite and the production server, verifies socket release, and clears process tracking files.

---

## 📋 Summary of URLs

| Mode | URL | Purpose |
|---|---|---|
| **Live Development** | `https://localhost:5173/` | Daily coding with live hot reload |
| **Local / LAN Preview** | `http://localhost:4173/` or `http://<LAN-IP>:4173/` | Production test & mobile access on same Wi-Fi |
| **Firebase Live Hosting** | `https://gvya-yoga-f3c9f.web.app/` | Permanent cloud URL (24/7 access) |
| **Public Membership Page** | `https://gvya-yoga-f3c9f.web.app/membership` | Customer plans & trial bookings |
| **Admin & Staff Login** | `https://gvya-yoga-f3c9f.web.app/login` | Staff portal (`admin@yogastudio.com` / `password123`) |
