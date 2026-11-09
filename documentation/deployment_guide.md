# Deployment & Production Operations Guide

## 1. Web Admin Dashboard Deployment

The web dashboard is built as an optimized Single Page Application (SPA) using React, Vite, and Tailwind CSS.

### 1.1 Deploying to Vercel
1. Install Vercel CLI or link through github.com:
   ```bash
   npm i -g vercel
   cd admin_dashboard
   vercel
   ```
2. Configure build settings in Vercel:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Set environment variables in the Vercel project settings dashboard matching `admin_dashboard/.env.example`.

### 1.2 Deploying to Firebase Hosting
1. Build the production bundle:
   ```bash
   cd admin_dashboard
   npm run build
   ```
2. Deploy via Firebase CLI:
   ```bash
   cd ../backend
   firebase deploy --only hosting
   ```

---

## 2. Customer Mobile Application Build

### 2.1 Android APK & App Bundle (AAB)
1. Verify keystore credentials in `android/key.properties` (never commit keys to source control).
2. Generate Release APK (for direct customer testing):
   ```bash
   cd mobile_app
   flutter build apk --release
   ```
   Output: `build/app/outputs/flutter-apk/app-release.apk`
3. Generate Release App Bundle (for Google Play Store upload):
   ```bash
   flutter build appbundle --release
   ```
   Output: `build/app/outputs/bundle/release/app-release.aab`

### 2.2 iOS IPA (for Apple TestFlight & App Store)
1. Open `mobile_app/ios` in Xcode on macOS.
2. Configure Signing & Capabilities with your Apple Developer Team ID.
3. Build the archive:
   ```bash
   flutter build ipa --release
   ```

---

## 3. Cloud Firestore Security Rules Deployment

Deploy rules and indexes to prevent unauthorized access:
```bash
cd backend
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

---

## 4. Jitsi Video Infrastructure Transition

- **Development Phase**: Default domain `meet.jit.si` (Free public cluster).
- **Production Commercial Transition**:
  - **Self-Hosted Docker**: Deploy Jitsi Meet on a VPS with Nginx SSL, Lua token auth (`mod_auth_token`), and Coturn STUN/TURN server.
  - **8x8 JaaS (Jitsi as a Service)**: Configure tenant domain and RS256 JWT tokens generated securely on Cloud Functions.

