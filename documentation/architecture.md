# System Architecture – Yoga Studio Management Platform

## 1. High-Level Architecture Overview

The Yoga Studio Management Platform is designed as a scalable, secure, cloud-enabled monorepo architecture serving three distinct personas:
- **Customers**: Access via cross-platform Flutter Mobile Application (Android & iOS).
- **Instructors**: Access via mobile app or web portal for assigned classes, attendance, and starting live video sessions.
- **Studio Administrators**: Access via dedicated React + Vite + TypeScript Admin Web Dashboard.

All clients share a single unified Firebase / Cloud Firestore backend, authentication layer, and Jitsi Meet video conferencing infrastructure.

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT LAYER                                       |
|                                                                                       |
|   +------------------------------------+      +-----------------------------------+   |
|   |       Customer Mobile App          |      |       Admin & Instructor Web      |   |
|   |         (Flutter / Dart)           |      |      (React / Vite / TS / Tailwind) | |
|   |  - Schedule Discovery (Online/Off) |      |  - Studio Operations & Scheduling |   |
|   |  - Package Purchases & Memberships |      |  - Customer & Instructor Mgmt     |   |
|   |  - One-Click Booking & Live Join   |      |  - Payments & Manual Verification |   |
|   |  - Jitsi Meet Native SDK           |      |  - Jitsi IFrame Live Web Host     |   |
|   +-----------------+------------------+      +-----------------+-----------------+   |
|                     |                                           |                     |
+---------------------|-------------------------------------------|---------------------+
                      | HTTPS / WSS / Firestore SDK               | HTTPS / SDK
                      v                                           v
+---------------------------------------------------------------------------------------+
|                                  FIREBASE BACKEND                                     |
|                                                                                       |
|   +-------------------------+  +-------------------------+  +---------------------+   |
|   |  Firebase Authentication|  |     Cloud Firestore     |  |   Firebase Storage  |   |
|   |  - Email/Pass, Google   |  |  - ACID Transactions    |  |  - Profile Photos   |   |
|   |  - Role Custom Claims   |  |  - Strict Security Rules|  |  - Payment Slips    |   |
|   +-------------------------+  +-------------------------+  +---------------------+   |
|                                             ^                                         |
|                                             |                                         |
|                        +--------------------+--------------------+                    |
|                        |     Cloud Functions (Optional/Server)   |                    |
|                        |  - Booking validations & notifications  |                    |
|                        |  - Payment webhook & credit restoration |                    |
|                        +--------------------+--------------------+                    |
+---------------------------------------------|-----------------------------------------+
                                              |
                                              v
+---------------------------------------------------------------------------------------+
|                               EXTERNAL INTEGRATIONS                                   |
|                                                                                       |
|   +----------------------------------+       +------------------------------------+   |
|   |        Jitsi Meet Bridge         |       |      Configurable Payment Gateways |   |
|   |  - Configurable Jitsi Domain     |       |  - Simulated Test Gateway          |   |
|   |  - Server-Generated Secure Rooms |       |  - Manual Bank Transfer / Proof    |   |
|   |  - Role-based Moderation / Mute  |       |  - Stripe / Razorpay / FPS / PayMe |   |
|   +----------------------------------+       +------------------------------------+   |
+---------------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Principles

1. **Transaction Safety**: All booking creations, cancellations, and credit deductions utilize Firestore transactions (`runTransaction`) to guarantee zero overbooking and prevent double-spending of session credits.
2. **Zero Client Trust Security**: Frontend requests cannot set administrative roles or alter package pricing. Role claims are governed by Firestore security rules inspecting `/users/{uid}.role` or Firebase Auth custom claims.
3. **Pluggable Video Conferencing**: The platform isolates the live video meeting layer behind a unified `JitsiService` interface. For local development, `meet.jit.si` is supported, with instant drop-in capability for 8x8 JaaS or self-hosted Jitsi Docker instances.
4. **Configurable Currency & Locale**: No currency or timezone is hardcoded. A centralized `studioSettings` document provides currency codes (e.g. `USD`, `HKD`, `INR`, `EUR`), currency symbols, and IANA timezone strings used for all calendar projections.
5. **Separation of Concerns**:
   - `mobile_app`: Optimized for mobile touch, low latency offline cache, push notifications, and native Jitsi calling.
   - `admin_dashboard`: Desktop/tablet optimized for bulk data, table operations, CSV exports, and administrative controls.
   - `backend`: Houses rules, indexes, and cloud functions.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Resource | Customer | Instructor | Studio Admin |
| :--- | :--- | :--- | :--- |
| **Classes (Browse)** | Read Active | Read Assigned/All | Read & Write All |
| **Bookings (Self)** | Read & Create (with credits) | Read Class Participants | Read & Cancel Any |
| **Memberships** | Read Own | Read Student Status | Read, Create, Grant, Modify |
| **Payments** | Read Own, Upload Proof | None | Read, Verify, Refund |
| **Live Meetings** | Join (window open + booked) | Start, Mute, End Assigned | Schedule, Monitor, Terminate |
| **Studio Settings**| Read Basic (Name, Policies) | Read Basic | Read & Write Full Config |
| **Activity Logs** | Read Own Logs | None | Read Studio Audit Trail |

---

## 4. Jitsi Video Conferencing Architecture

To prevent unauthorized video room hijacking:
- Room names are generated using cryptographic high-entropy IDs prefixed with the studio identifier (e.g. `yoga_studio_<classId>_<salt>`).
- Customers can only acquire the room name and access button if:
  1. User is authenticated.
  2. An active booking exists for `classId` belonging to `userId`.
  3. The current time falls within `[startTime - 15 minutes, endTime + 15 minutes]`.
  4. Class status is `scheduled` or `live`.
- Mobile users enter with microphone muted by default and video optional.
- Instructors join as dominant speaker / moderator.

