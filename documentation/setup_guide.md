# Development Environment & Setup Guide

This guide walks you through setting up the complete environment on Windows (and macOS/Linux), configuring Firebase, running local emulators, and launching both the mobile app and web dashboard.

---

## 1. Local Prerequisites Installation (Windows)

### 1.1 Node.js & npm (Required for Admin Dashboard & Firebase CLI)
1. Download the LTS installer from [Node.js Official Website](https://nodejs.org) or install via terminal:
   ```powershell
   winget install OpenJS.NodeJS.LTS
   ```
2. Verify installation:
   ```powershell
   node -v
   npm -v
   ```

### 1.2 Flutter & Dart (Required for Customer Mobile App)
1. Download Flutter SDK for Windows from [flutter.dev](https://docs.flutter.dev/get-started/install/windows/mobile).
2. Extract the zip to `C:\src\flutter` (do not install in `C:\Program Files`).
3. Add `C:\src\flutter\bin` to your User `PATH` environment variable.
4. Run:
   ```powershell
   flutter doctor
   ```

### 1.3 Android SDK & Java (For Android mobile app execution)
1. Install [Android Studio](https://developer.android.com/studio).
2. Open Android Studio -> SDK Manager -> Install:
   - Android SDK Command-line Tools
   - Android SDK Platform-Tools (adb)
   - Android 14 / 13 SDK Platform
3. Set environment variables:
   - `ANDROID_HOME`: `C:\Users\<username>\AppData\Local\Android\Sdk`
   - Add `%ANDROID_HOME%\platform-tools` to `PATH`.

---

## 2. Firebase Configuration

### 2.1 Firebase Console Setup
1. Visit [Firebase Console](https://console.firebase.google.com/) and create a new project (e.g. `yoga-studio-platform`).
2. Enable Authentication:
   - Navigate to **Authentication** -> **Sign-in method**.
   - Enable **Email/Password**.
   - (Optional) Enable **Google**.
3. Create Cloud Firestore:
   - Navigate to **Firestore Database** -> **Create database**.
   - Choose production mode and select your closest cloud region.
4. Enable Firebase Storage:
   - Navigate to **Storage** -> **Get started**.
5. Register Apps:
   - **Web App**: For the admin dashboard. Copy the `firebaseConfig` keys into `admin_dashboard/.env`.
   - **Android App**: Register package `com.yogastudio.mobile_app`. Download `google-services.json` into `mobile_app/android/app/`.
   - **iOS App**: Register bundle ID `com.yogastudio.mobileApp`. Download `GoogleService-Info.plist` into `mobile_app/ios/Runner/`.

---

## 3. Local Firebase Emulator Suite (Offline Testing)

The project includes pre-configured emulator settings in `backend/firebase.json`.

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Start the Emulators:
   ```bash
   cd backend
   firebase emulators:start
   ```
   Emulators will start on:
   - Auth: `localhost:9099`
   - Firestore: `localhost:8080`
   - Storage: `localhost:9199`
   - UI Suite: `http://localhost:4000`

---

## 4. Environment Variables

### 4.1 Admin Dashboard (`admin_dashboard/.env`)
```ini
VITE_FIREBASE_API_KEY="AIzaSyYourMockApiKeyForDev"
VITE_FIREBASE_AUTH_DOMAIN="yoga-studio-dev.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="yoga-studio-dev"
VITE_FIREBASE_STORAGE_BUCKET="yoga-studio-dev.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef123456"
VITE_USE_FIREBASE_EMULATOR="false"
VITE_JITSI_DOMAIN="meet.jit.si"
```

### 4.2 Mobile App (`mobile_app/lib/config/firebase_options.dart`)
Configured to use environment defaults or local emulator fallback seamlessly.

---

## 5. Running the Applications

### 5.1 Admin Dashboard
```bash
cd admin_dashboard
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 5.2 Mobile App
```bash
cd mobile_app
flutter pub get
flutter run
```
Choose Chrome (for fast web preview) or an Android emulator / connected physical device.

