import 'package:flutter_test/flutter_test.dart';
import 'package:yoga_studio_app/models/class_model.dart';

void main() {
  group('Class Booking Validation & Capacity Tests', () {
    test('Class detects when full and prevents booking', () {
      final fullClass = ClassModel(
        classId: 'c_full',
        title: 'Full Hatha Class',
        description: 'Test class description',
        category: 'Hatha Yoga',
        instructorId: 'i1',
        instructorName: 'Elena Vance',
        bookingType: 'offline',
        startTime: DateTime.now().add(const Duration(hours: 4)),
        endTime: DateTime.now().add(const Duration(hours: 5)),
        durationMinutes: 60,
        capacity: 15,
        bookedSeats: 15,
      );

      expect(fullClass.isFull, isTrue);
      expect(fullClass.availableSeats, equals(0));
    });

    test('Class detects available spots when not full', () {
      final openClass = ClassModel(
        classId: 'c_open',
        title: 'Open Vinyasa Class',
        description: 'Test class description',
        category: 'Vinyasa Yoga',
        instructorId: 'i1',
        instructorName: 'Elena Vance',
        bookingType: 'online',
        startTime: DateTime.now().add(const Duration(hours: 4)),
        endTime: DateTime.now().add(const Duration(hours: 5)),
        durationMinutes: 60,
        capacity: 30,
        bookedSeats: 18,
      );

      expect(openClass.isFull, isFalse);
      expect(openClass.availableSeats, equals(12));
    });

    test('Live room join window is active only within configured minutes before start', () {
      final now = DateTime.now();

      // Class starting in 10 minutes (within 15 min join window)
      final activeClass = ClassModel(
        classId: 'c_active',
        title: 'Imminent Live Stream',
        description: 'Starts soon',
        category: 'Meditation',
        instructorId: 'i1',
        instructorName: 'Elena Vance',
        bookingType: 'online',
        startTime: now.add(const Duration(minutes: 10)),
        endTime: now.add(const Duration(minutes: 70)),
        durationMinutes: 60,
        capacity: 40,
        bookedSeats: 10,
        joinWindowMinutesBefore: 15,
      );

      expect(activeClass.canJoinLive, isTrue);

      // Class starting in 2 hours (outside 15 min join window)
      final futureClass = ClassModel(
        classId: 'c_future',
        title: 'Far Future Stream',
        description: 'Starts much later',
        category: 'Meditation',
        instructorId: 'i1',
        instructorName: 'Elena Vance',
        bookingType: 'online',
        startTime: now.add(const Duration(hours: 2)),
        endTime: now.add(const Duration(hours: 3)),
        durationMinutes: 60,
        capacity: 40,
        bookedSeats: 5,
        joinWindowMinutesBefore: 15,
      );

      expect(futureClass.canJoinLive, isFalse);
    });
  });
}

