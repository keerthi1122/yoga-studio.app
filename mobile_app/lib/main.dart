import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'config/theme.dart';
import 'config/constants.dart';
import 'config/firebase_options.dart';
import 'routing/app_router.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase with fallback tolerance for offline/dev
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    // Register top-level FCM background message handler (native mobile only)
    if (!kIsWeb) {
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    }
  } catch (e) {
    debugPrint('[Firebase Init] Offline/Mock fallback active: $e');
  }

  runApp(
    const ProviderScope(
      child: PranaYogaStudioApp(),
    ),
  );
}

class PranaYogaStudioApp extends ConsumerStatefulWidget {
  const PranaYogaStudioApp({super.key});

  @override
  ConsumerState<PranaYogaStudioApp> createState() => _PranaYogaStudioAppState();
}

class _PranaYogaStudioAppState extends ConsumerState<PranaYogaStudioApp> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!kIsWeb) {
        ref.read(notificationServiceProvider).initialize();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: router,
    );
  }
}
