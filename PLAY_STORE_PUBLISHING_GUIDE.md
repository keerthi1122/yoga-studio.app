# Google Play Store Publishing Guide — GVYA Yoga Studio

Your project is ready for Google Play Store distribution via two paths:

## Path A: Publish the Web App to Play Store in ~15 Minutes (Trusted Web Activity / PWA)
The web application in [admin_dashboard](file:///c:/Users/aswat/Downloads/yoga-studio.app-main/yoga-studio.app-main/admin_dashboard) has been configured as an installable, Play Store-compatible PWA:
- **PWA Manifest**: [manifest.json](file:///c:/Users/aswat/Downloads/yoga-studio.app-main/yoga-studio.app-main/admin_dashboard/public/manifest.json)
- **Raster Icons**: `public/icons/icon-192.png` and `public/icons/icon-512.png` (`any` + `maskable`)
- **Offline Service Worker**: [sw.js](file:///c:/Users/aswat/Downloads/yoga-studio.app-main/yoga-studio.app-main/admin_dashboard/public/sw.js)
- **Digital Asset Links Template**: [assetlinks.json](file:///c:/Users/aswat/Downloads/yoga-studio.app-main/yoga-studio.app-main/admin_dashboard/public/.well-known/assetlinks.json)

### Steps to Generate Signed Android `.aab` for Google Play Console
1. Install JDK 17+ and Google's Bubblewrap CLI:
   ```bash
   npm install -g @bubblewrap/cli
   ```
2. Initialize the TWA Android wrapper from your live HTTPS URL:
   ```bash
   mkdir gvya-android-twa && cd gvya-android-twa
   bubblewrap init --manifest="https://gvya-yoga-f3c9f.web.app/manifest.json"
   ```
   - Package ID suggestion: `com.gvya.yogastudio.twa`
   - Let Bubblewrap generate your release keystore (keep the `.keystore` password backed up safely!).
3. Build the Google Play App Bundle (`.aab`):
   ```bash
   bubblewrap build
   ```
   Output: `app-release-bundle.aab` + `assetlinks.json`.
4. Copy the SHA-256 fingerprint from Bubblewrap (or from **Play Console → Setup → App Integrity → App signing key certificate**) into [assetlinks.json](file:///c:/Users/aswat/Downloads/yoga-studio.app-main/yoga-studio.app-main/admin_dashboard/public/.well-known/assetlinks.json) and re-deploy hosting so the Android status bar disappears cleanly inside TWA.
5. Upload `app-release-bundle.aab` in Google Play Console (Internal Testing → Production).

---

## Path B: Native Flutter Mobile App (`.aab` Release Build)
The native Flutter companion app lives at [mobile_app](file:///c:/Users/aswat/Downloads/yoga-studio.app-main/yoga-studio.app-main/mobile_app):
1. Place your Firebase Android config at `mobile_app/android/app/google-services.json`.
2. Update `applicationId` and add a real release signing config in [build.gradle.kts](file:///c:/Users/aswat/Downloads/yoga-studio.app-main/yoga-studio.app-main/mobile_app/android/app/build.gradle.kts) (never ship debug keys to Play Console).
3. Run:
   ```bash
   cd mobile_app
   flutter build appbundle --release
   ```
   Output: `build/app/outputs/bundle/release/app-release.aab`.
