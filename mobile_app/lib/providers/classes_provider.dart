import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/class_model.dart';
import '../services/firestore_service.dart';

final firestoreServiceProvider = Provider<FirestoreService>((ref) => FirestoreService());

final classesStreamProvider = StreamProvider<List<ClassModel>>((ref) {
  final firestoreService = ref.watch(firestoreServiceProvider);
  return firestoreService.streamClasses();
});

// Filter state providers
final selectedDateProvider = StateProvider<DateTime>((ref) => DateTime.now());
final selectedCategoryProvider = StateProvider<String>((ref) => 'All Categories');
final selectedInstructorProvider = StateProvider<String>((ref) => 'All Teachers');

// Filtered classes provider
final filteredClassesProvider = Provider<List<ClassModel>>((ref) {
  final classesAsync = ref.watch(classesStreamProvider);
  final selectedCategory = ref.watch(selectedCategoryProvider);
  final selectedInstructor = ref.watch(selectedInstructorProvider);
  final selectedDate = ref.watch(selectedDateProvider);

  return classesAsync.when(
    data: (classes) {
      return classes.where((c) {
        final matchesCategory = selectedCategory == 'All Categories' || c.category == selectedCategory;
        final matchesInstructor = selectedInstructor == 'All Teachers' || c.instructorName == selectedInstructor;
        final matchesDate = c.startTime.year == selectedDate.year &&
                            c.startTime.month == selectedDate.month &&
                            c.startTime.day == selectedDate.day;
        return matchesCategory && matchesInstructor && matchesDate;
      }).toList();
    },
    loading: () => [],
    error: (_, __) => [],
  );
});

