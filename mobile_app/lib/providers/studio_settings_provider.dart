import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/studio_settings_model.dart';
import 'classes_provider.dart';

final studioSettingsStreamProvider = StreamProvider<StudioSettingsModel>((ref) {
  final firestoreService = ref.watch(firestoreServiceProvider);
  return firestoreService.streamStudioSettings();
});

