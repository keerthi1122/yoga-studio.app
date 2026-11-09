import 'package:flutter_test/flutter_test.dart';
import 'package:yoga_studio_app/models/user_model.dart';
import 'package:yoga_studio_app/models/class_model.dart';
import 'package:yoga_studio_app/models/booking_model.dart';
import 'package:yoga_studio_app/models/membership_model.dart';
import 'package:yoga_studio_app/services/booking_service.dart';

void main() {
  group('Phase 5: Booking & Membership Business Logic Comprehensive Suite', () {
    late UserModel userWithCredits;
    late UserModel userNoCredits;
    late ClassModel openClass;
    late ClassModel fullClass;
    late ClassModel pastClass;
    late ClassModel cancelledClass;
    late MembershipModel unlimitedMembership;
    late MembershipModel creditMembership;

    setUp(() {
      final now = DateTime.now();

      userWithCredits = const UserModel(
        uid: 'user_with_credits',
        fullName: 'Aria Sharma',
        email: 'aria@example.com',
        remainingCredits: 5,
        status: 'active',
      );

      userNoCredits = const UserModel(
        uid: 'user_no_credits',
        fullName: 'Dev Patel',
        email: 'dev@example.com',
        remainingCredits: 0,
        status: 'active',
      );

      openClass = ClassModel(
        classId: 'c_open_101',
        title: 'Morning Vinyasa Flow',
        description: 'Dynamic alignment',
        category: 'Vinyasa Yoga',
        instructorId: 'i_1',
        instructorName: 'Elena Vance',
        bookingType: 'online',
        startTime: now.add(const Duration(hours: 24)),
        endTime: now.add(const Duration(hours: 25)),
        durationMinutes: 60,
        capacity: 20,
        bookedSeats: 12,
        status: 'scheduled',
      );

      fullClass = ClassModel(
        classId: 'c_full_102',
        title: 'Restorative Yin Yoga',
        description: 'Deep relaxation',
        category: 'Yin Yoga',
        instructorId: 'i_2',
        instructorName: 'Marcus Chen',
        bookingType: 'offline',
        startTime: now.add(const Duration(hours: 18)),
        endTime: now.add(const Duration(hours: 19)),
        durationMinutes: 60,
        capacity: 15,
        bookedSeats: 15, // FULL
        status: 'scheduled',
      );

      pastClass = ClassModel(
        classId: 'c_past_103',
        title: 'Dawn Meditation',
        description: 'Early morning stillness',
        category: 'Meditation',
        instructorId: 'i_1',
        instructorName: 'Elena Vance',
        bookingType: 'online',
        startTime: now.subtract(const Duration(hours: 2)), // PAST
        endTime: now.subtract(const Duration(hours: 1)),
        durationMinutes: 60,
        capacity: 30,
        bookedSeats: 10,
        status: 'scheduled',
      );

      cancelledClass = ClassModel(
        classId: 'c_cancelled_104',
        title: 'Kids Yoga Flow',
        description: 'Playful yoga',
        category: 'Kids Yoga',
        instructorId: 'i_3',
        instructorName: 'Sarah Jenkins',
        bookingType: 'offline',
        startTime: now.add(const Duration(hours: 20)),
        endTime: now.add(const Duration(hours: 21)),
        durationMinutes: 60,
        capacity: 10,
        bookedSeats: 4,
        status: 'cancelled', // CANCELLED
      );

      unlimitedMembership = MembershipModel(
        membershipId: 'mem_unlimited_vip',
        userId: 'user_no_credits',
        packageId: 'pkg_vip_month',
        packageName: 'VIP Monthly Unlimited Pass',
        startDate: now.subtract(const Duration(days: 5)),
        expiryDate: now.add(const Duration(days: 25)),
        totalCredits: -1,
        remainingCredits: 0,
        unlimited: true,
        status: 'active',
      );

      creditMembership = MembershipModel(
        membershipId: 'mem_pack_10',
        userId: 'user_with_credits',
        packageId: 'pkg_10',
        packageName: '10-Session Flexible Pack',
        startDate: now.subtract(const Duration(days: 10)),
        expiryDate: now.add(const Duration(days: 80)),
        totalCredits: 10,
        remainingCredits: 5,
        unlimited: false,
        status: 'active',
      );
    });

    test('1. Capacity Guard: Rejects reservation on completely full class', () async {
      final bookingService = BookingService();

      expect(
        () => bookingService.createBooking(
          user: userWithCredits,
          yogaClass: fullClass,
        ),
        throwsA(isA<BookingException>().having(
          (e) => e.message,
          'message',
          contains('completely full'),
        )),
      );
    });

    test('2. Timing Guard: Rejects reservation for classes in the past', () async {
      final bookingService = BookingService();

      expect(
        () => bookingService.createBooking(
          user: userWithCredits,
          yogaClass: pastClass,
        ),
        throwsA(isA<BookingException>().having(
          (e) => e.message,
          'message',
          contains('already started or booking deadline has passed'),
        )),
      );
    });

    test('3. Status Guard: Rejects reservation on cancelled classes', () async {
      final bookingService = BookingService();

      expect(
        () => bookingService.createBooking(
          user: userWithCredits,
          yogaClass: cancelledClass,
        ),
        throwsA(isA<BookingException>().having(
          (e) => e.message,
          'message',
          contains('no longer open for booking'),
        )),
      );
    });

    test('4. Credit Guard: Rejects user with 0 credits and no unlimited pass', () async {
      final bookingService = BookingService();

      expect(
        () => bookingService.createBooking(
          user: userNoCredits,
          yogaClass: openClass,
        ),
        throwsA(isA<BookingException>().having(
          (e) => e.message,
          'message',
          contains('Insufficient class credits'),
        )),
      );
    });

    test('5. Unlimited Pass Privilege: Allows booking with 0 credits and does not consume credits', () async {
      final bookingService = BookingService();

      final booking = await bookingService.createBooking(
        user: userNoCredits,
        yogaClass: openClass,
        activeMembership: unlimitedMembership,
      );

      expect(booking.bookingStatus, 'confirmed');
      expect(booking.creditDeducted, 0); // 0 credit deducted
      expect(booking.membershipId, 'mem_unlimited_vip');
    });

    test('6. Credit-based Pass: Consumes exactly 1 credit', () async {
      final bookingService = BookingService();

      final booking = await bookingService.createBooking(
        user: userWithCredits,
        yogaClass: openClass,
        activeMembership: creditMembership,
      );

      expect(booking.bookingStatus, 'confirmed');
      expect(booking.creditDeducted, 1);
      expect(booking.classTitle, 'Morning Vinyasa Flow');
    });

    test('7. Cancellation Policy: 13 hours prior to class (> 12h) grants refund', () async {
      final bookingService = BookingService();
      final now = DateTime.now();

      final booking = BookingModel(
        bookingId: 'bk_early_cancel',
        userId: userWithCredits.uid,
        userFullName: userWithCredits.fullName,
        userEmail: userWithCredits.email,
        classId: openClass.classId,
        classTitle: openClass.title,
        instructorName: openClass.instructorName,
        classStartTime: now.add(const Duration(hours: 13)), // 13h ahead
        classEndTime: now.add(const Duration(hours: 14)),
        bookingType: 'online',
        creditDeducted: 1,
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
      );

      final isRefunded = await bookingService.cancelBooking(
        booking: booking,
        customCancellationHours: 12,
      );

      expect(isRefunded, isTrue);
    });

    test('8. Cancellation Policy: 4 hours prior to class (< 12h) forfeits refund', () async {
      final bookingService = BookingService();
      final now = DateTime.now();

      final booking = BookingModel(
        bookingId: 'bk_late_cancel',
        userId: userWithCredits.uid,
        userFullName: userWithCredits.fullName,
        userEmail: userWithCredits.email,
        classId: openClass.classId,
        classTitle: openClass.title,
        instructorName: openClass.instructorName,
        classStartTime: now.add(const Duration(hours: 4)), // 4h ahead (Late)
        classEndTime: now.add(const Duration(hours: 5)),
        bookingType: 'online',
        creditDeducted: 1,
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
      );

      final isRefunded = await bookingService.cancelBooking(
        booking: booking,
        customCancellationHours: 12,
      );

      expect(isRefunded, isFalse);
    });

    test('9. Studio Policy Custom Cutoff: 6-hour window respects customized threshold', () async {
      final bookingService = BookingService();
      final now = DateTime.now();

      final booking = BookingModel(
        bookingId: 'bk_custom_policy',
        userId: userWithCredits.uid,
        userFullName: userWithCredits.fullName,
        userEmail: userWithCredits.email,
        classId: openClass.classId,
        classTitle: openClass.title,
        instructorName: openClass.instructorName,
        classStartTime: now.add(const Duration(hours: 8)), // 8h ahead
        classEndTime: now.add(const Duration(hours: 9)),
        bookingType: 'online',
        creditDeducted: 1,
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
      );

      // With 6-hour cutoff: 8h is eligible
      final isRefunded6h = await bookingService.cancelBooking(
        booking: booking,
        customCancellationHours: 6,
      );
      expect(isRefunded6h, isTrue);

      // With 24-hour cutoff: 8h is late
      final isRefunded24h = await bookingService.cancelBooking(
        booking: booking,
        customCancellationHours: 24,
      );
      expect(isRefunded24h, isFalse);
    });
  });
}

