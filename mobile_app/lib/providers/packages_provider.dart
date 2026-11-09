import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/package_model.dart';
import 'classes_provider.dart';

final packagesStreamProvider = StreamProvider<List<PackageModel>>((ref) {
  final firestoreService = ref.watch(firestoreServiceProvider);
  return firestoreService.streamPackages();
});

