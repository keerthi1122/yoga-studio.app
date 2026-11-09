import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Top-level background message handler invoked by native platform when app is in background or terminated.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp();
    }
  } catch (e) {
    debugPrint('[FCM Background] Initialization error: $e');
  }
  debugPrint('[FCM Background] Received message: ${message.messageId} | notification: ${message.notification?.title}');
}

class NotificationService {
  FirebaseMessaging? _messaging;
  FirebaseFirestore? _firestore;
  static const String _tokenStorageKey = 'fcm_device_token';

  NotificationService({
    FirebaseMessaging? messaging,
    FirebaseFirestore? firestore,
  })  : _messaging = messaging,
        _firestore = firestore;

  FirebaseMessaging get messaging => _messaging ??= FirebaseMessaging.instance;
  FirebaseFirestore get firestore => _firestore ??= FirebaseFirestore.instance;

  /// Initializes FCM messaging, permissions, token registration and message listeners
  Future<void> initialize({
    Function(RemoteMessage)? onNotificationSelected,
  }) async {
    if (Firebase.apps.isEmpty) {
      debugPrint('[FCM] Firebase not initialized; skipping FCM initialization.');
      return;
    }

    try {
      // 1. Request notification permissions (required on iOS/Web/Android 13+)
      final NotificationSettings settings = await messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      debugPrint('[FCM] Authorization status: ${settings.authorizationStatus}');

      // 2. Fetch and cache APNS/FCM device token
      String? token;
      try {
        token = await messaging.getToken();
        if (token != null) {
          debugPrint('[FCM] Device Token: ${token.substring(0, token.length > 10 ? 10 : token.length)}...');
          await _persistTokenLocally(token);
        }
      } catch (tokenErr) {
        debugPrint('[FCM] Error obtaining FCM token: $tokenErr');
      }

      // 3. Listen to token refresh events
      messaging.onTokenRefresh.listen((newToken) async {
        debugPrint('[FCM] Device token refreshed.');
        await _persistTokenLocally(newToken);
      });

      // 4. Foreground message listener
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('[FCM Foreground] Title: ${message.notification?.title}, Body: ${message.notification?.body}');
      });

      // 5. App opened from background notification click
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('[FCM Background Click] Interacted message: ${message.messageId}');
        if (onNotificationSelected != null) {
          onNotificationSelected(message);
        }
      });

      // 6. App launched from terminated state via notification click
      final initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null && onNotificationSelected != null) {
        onNotificationSelected(initialMessage);
      }
    } catch (e) {
      debugPrint('[FCM] Error initializing notifications: $e');
    }
  }

  /// Persists token securely in local SharedPreferences
  Future<void> _persistTokenLocally(String token) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_tokenStorageKey, token);
    } catch (e) {
      debugPrint('[FCM] Failed to cache token locally: $e');
    }
  }

  /// Retrieves locally cached FCM token
  Future<String?> getStoredToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_tokenStorageKey);
    } catch (_) {
      return null;
    }
  }

  /// Registers user's FCM device token in their secure Firestore profile
  Future<void> registerUserToken(String userId) async {
    if (Firebase.apps.isEmpty || userId.isEmpty) return;

    try {
      String? token = await getStoredToken();
      token ??= await messaging.getToken();

      if (token != null) {
        final userRef = firestore.collection('users').doc(userId);
        await userRef.set({
          'fcmTokens': FieldValue.arrayUnion([token]),
          'lastTokenUpdate': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
        debugPrint('[FCM] Token successfully registered for user $userId');
      }
    } catch (e) {
      debugPrint('[FCM] Could not register user FCM token: $e');
    }
  }

  /// Deregisters user's FCM token upon sign-out
  Future<void> unregisterUserToken(String userId) async {
    if (Firebase.apps.isEmpty || userId.isEmpty) return;

    try {
      final token = await getStoredToken();
      if (token != null) {
        final userRef = firestore.collection('users').doc(userId);
        await userRef.update({
          'fcmTokens': FieldValue.arrayRemove([token]),
        });
        debugPrint('[FCM] Token removed for user $userId');
      }
    } catch (e) {
      debugPrint('[FCM] Error unregistering token: $e');
    }
  }
}

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});

