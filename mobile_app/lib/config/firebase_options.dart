import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Default [FirebaseOptions] for use with your Firebase apps.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        return android;
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyBDzovox5JS3roZvxofpX8Jjei6T31i1UQ',
    appId: '1:799318188921:web:5b7990cbcb5090c4d585a8',
    messagingSenderId: '799318188921',
    projectId: 'yogastudio-2d89b',
    authDomain: 'yogastudio-2d89b.firebaseapp.com',
    storageBucket: 'yogastudio-2d89b.firebasestorage.app',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCOQxD5yGbo82sydbfq6eYlhsGLsuLXWyk',
    appId: '1:799318188921:android:d4936138e4e49b9ad585a8',
    messagingSenderId: '799318188921',
    projectId: 'yogastudio-2d89b',
    storageBucket: 'yogastudio-2d89b.firebasestorage.app',
  );
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyA2asee5BujJtHbewuGqH1s-FXIAFDIUXo',
    appId: '1:799318188921:ios:9ce13b8e05bdfabed585a8',
    messagingSenderId: '799318188921',
    projectId: 'yogastudio-2d89b',
    storageBucket: 'yogastudio-2d89b.firebasestorage.app',
    iosBundleId: 'com.yogastudio.mobileApp',
  );
}
