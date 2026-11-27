# Yoga Studio Management & Booking Platform

A comprehensive, production-ready full-stack Yoga Studio Booking and Operations Platform. Features a cross-platform mobile app for yoga practitioners, a responsive web admin dashboard for studio management, and shared Firebase and Jitsi live video infrastructure.

---

## 🚀 1-Click Launchers (Admin Dashboard)

Launch and access the web dashboard anytime with a single click:

- **`start_app.vbs`** (Recommended): Double-click to start the dev server silently in background & automatically open browser to `https://localhost:5173/`. Includes Live Hot-Reloading for file edits in `admin_dashboard/src/`.
- **`start_app.bat`**: Interactive console launcher with live compilation and HMR logs.
- **`stop_app.bat`**: Double-click to instantly stop all active servers and free port 5173.
- **`start_preview.bat`**: Builds production bundle and starts local/LAN persistent server on `http://localhost:4173/`.
- **`deploy_firebase.bat`**: Automated Firebase Hosting deployment (Temporary preview channel or live hosting).

See [QUICK_START_LAUNCHER_GUIDE.md](file:///c:/Users/aswat/Downloads/yoga-studio.app-main/QUICK_START_LAUNCHER_GUIDE.md) for full instructions.

---

## Architecture & Tech Stack

```
Yoga Studio Platform
├── mobile_app/         # Customer Mobile App (Flutter, Dart, Riverpod, GoRouter, Jitsi SDK)
├── admin_dashboard/    # Studio Operations Web Dashboard (React 18, Vite, TypeScript, Tailwind CSS)
├── backend/            # Firebase Infrastructure (Firestore Rules, Indexes, Storage Rules, Cloud Functions)
└── documentation/      # Architectural blueprints, database schemas, and setup manuals
```

- **Customer Mobile App**: Flutter 3.x, Dart 3.x, Riverpod 2.x, GoRouter, Firebase SDK, Jitsi Meet Flutter SDK.
- **Admin & Instructor Web Dashboard**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Firebase Web SDK.
- **Backend & Database**: Google Cloud Firestore, Firebase Authentication, Firebase Storage, Cloud Functions.
- **Live Video Conferencing**: Jitsi Meet (Native SDK on mobile, Jitsi IFrame API on web).
- **Design System**: Warm, peaceful wellness palette (Deep Burgundy `#8F2F1B`, Warm Beige `#E9DCC5`, Cream `#F7F1E5`, Sage Green `#82977A`, Dark Brown `#302820`).

---

## Monorepo Structure

```
yoga-studio-platform/
├── mobile_app/
│   ├── lib/
│   │   ├── config/          # Theme, constants, firebase config
│   │   ├── core/            # Date/currency utils, helpers
│   │   ├── models/          # User, Class, Booking, Package, Membership, etc.
│   │   ├── services/        # Auth, Firestore, Booking transactions, Jitsi, Payments
│   │   ├── providers/       # Riverpod state providers
│   │   ├── routing/         # GoRouter navigation & route guards
│   │   ├── features/        # Feature modules (home, schedule, live, profile...)
│   │   └── shared/         # Reusable widgets (buttons, cards, chips, dialogs)
│   ├── android/             # Android native manifest with camera/audio permissions
│   ├── ios/                 # iOS native plist configurations
│   ├── test/                # Unit & business logic tests
│   └── pubspec.yaml         # Flutter dependencies
│
├── admin_dashboard/
│   ├── src/
│   │   ├── components/      # UI component library (Buttons, Modals, Tables, StatCards)
│   │   ├── layouts/         # Collapsible admin sidebar and topbar
│   │   ├── pages/           # Dashboard, Classes, Customers, Instructors, Live, Payments...
│   │   ├── services/        # Firestore & Auth services
│   │   ├── types/           # Complete TypeScript interfaces
│   │   ├── firebase/        # SDK initialization and emulator bridge
│   │   └── routes/          # Protected role-based route definitions
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/
│   ├── firestore.rules      # Production role-based security rules
│   ├── firestore.indexes.json # Composite query indexes
│   ├── storage.rules        # Storage bucket security policies
│   ├── firebase.json        # Emulator & hosting definitions
│   └── functions/           # Cloud Functions triggers
│
└── documentation/
    ├── architecture.md      # Detailed system blueprints
    ├── database_schema.md   # Complete Firestore entity specifications
    ├── setup_guide.md       # Step-by-step developer environment setup
    ├── deployment_guide.md  # Hosting and mobile release manuals
    └── api_documentation.md # Transaction specifications and policies
```

---

## Key Features

1. **Dual In-Person & Live Online Yoga Scheduling**: Separate, filterable views for online streaming sessions vs. physical studio classes.
2. **Atomic Booking Engine**: Concurrency-safe transactions prevent duplicate bookings and overbooking down to the final seat.
3. **Flexible Memberships & Credit Management**: Support for single drop-in classes, multi-class packs, and unlimited passes with automatic credit deduction and cancellation policy refunds.
4. **Embedded Jitsi Live Streaming**: Direct in-app video conferencing. Automatic host privileges for instructors, default mic-mute for practitioners, and secure time-windowed room joining.
5. **Configurable Currency & Studio Branding**: Dynamic support for international currencies (USD, HKD, EUR, INR) and studio location settings.
6. **Payment & Approval Workflow**: Instant simulated gateway for development and manual bank transfer with receipt screenshot verification.

---

## Quick Start

### 1. Web Admin Dashboard
```bash
cd admin_dashboard
npm install
npm run dev
```

### 2. Customer Mobile App
```bash
cd mobile_app
flutter pub get
flutter run
```

### 3. Local Firebase Emulators
```bash
cd backend
firebase emulators:start
```

See [documentation/setup_guide.md](documentation/setup_guide.md) for full prerequisites and instructions.

