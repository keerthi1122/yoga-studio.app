import 'package:flutter_test/flutter_test.dart';
import 'package:yoga_studio_app/models/user_model.dart';
import 'package:yoga_studio_app/models/booking_model.dart';
import 'package:yoga_studio_app/models/class_model.dart';
import 'package:yoga_studio_app/services/jitsi_service.dart';

void main() {
  group('Phase 6: Jitsi Video Conferencing Integration Suite', () {
    test('1. Deterministic Room Name Generator produces clean, URL-safe names', () {
      final room1 = JitsiService.generateRoomName('c101', 'Sunrise Vinyasa Flow');
      expect(room1, equals('yoga_studio_c101_sunrise_vinyasa_flow'));

      // Special characters, spaces, and punctuation handling
      final room2 = JitsiService.generateRoomName('c_#99@!', 'Hatha & Pranayama: Deep Breath!');
      expect(room2, equals('yoga_studio_c_99_hatha_pranayama_deep_breath'));
      expect(room2.contains('&'), isFalse);
      expect(room2.contains(':'), isFalse);
      expect(room2.contains('!'), isFalse);

      // Max length limit check
      final roomLong = JitsiService.generateRoomName(
        'very_long_class_id_1234567890',
        'Extremely Long Title For A Restorative Yin Yoga Gong Bath Sound Healing Class',
      );
      expect(roomLong.length, lessThanOrEqualTo(50));
    });

    test('2. Server URL Formatter ensures valid HTTPS scheme', () {
      expect(JitsiService.formatServerUrl('meet.jit.si'), equals('https://meet.jit.si'));
      expect(JitsiService.formatServerUrl('video.myyogastudio.com'), equals('https://video.myyogastudio.com'));
      expect(JitsiService.formatServerUrl('https://custom.jitsi.domain'), equals('https://custom.jitsi.domain'));
      expect(JitsiService.formatServerUrl('http://localhost:8443'), equals('http://localhost:8443'));
    });

    test('3. Practitioner Conference Options are configured with peaceful wellness defaults', () {
      const user = UserModel(
        uid: 'yogi_maya',
        fullName: 'Maya Lin',
        email: 'maya@example.com',
        photoUrl: 'https://example.com/avatar.jpg',
      );

      final now = DateTime.now();
      final booking = BookingModel(
        bookingId: 'bk_live_01',
        userId: user.uid,
        userFullName: user.fullName,
        userEmail: user.email,
        classId: 'class_vinyasa_01',
        classTitle: 'Morning Gentle Vinyasa',
        instructorName: 'Elena Vance',
        classStartTime: now.add(const Duration(minutes: 5)),
        classEndTime: now.add(const Duration(minutes: 65)),
        bookingType: 'online',
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
        jitsiRoom: 'yoga_studio_vinyasa_live',
      );

      final options = JitsiService.buildConferenceOptions(
        booking: booking,
        user: user,
        serverDomain: 'meet.jit.si',
      );

      expect(options.room, equals('yoga_studio_vinyasa_live'));
      expect(options.serverURL, equals('https://meet.jit.si'));

      // Check audio muted for quiet entrance, camera enabled for posture alignment
      expect(options.configOverrides?['startWithAudioMuted'], isTrue);
      expect(options.configOverrides?['startWithVideoMuted'], isFalse);

      // Welcome and prejoin bypass
      expect(options.featureFlags?['welcomePageEnabled'], isFalse);
      expect(options.featureFlags?['prejoinPageEnabled'], isFalse);

      // PIP mode enabled for practicing while switching tabs
      expect(options.featureFlags?['pip.enabled'], isTrue);

      // User info correctly assigned
      expect(options.userInfo?.displayName, equals('Maya Lin'));
      expect(options.userInfo?.email, equals('maya@example.com'));
      expect(options.userInfo?.avatar, equals('https://example.com/avatar.jpg'));
    });

    test('4. 15-Minute Pre-Class Join Window Gating Logic', () {
      final now = DateTime.now();

      // Case A: 10 minutes prior to start -> OPEN (within 15 min window)
      final imminentBooking = BookingModel(
        bookingId: 'b_imminent',
        userId: 'u1',
        userFullName: 'Yogi',
        userEmail: 'y@example.com',
        classId: 'c1',
        classTitle: 'Vinyasa',
        instructorName: 'Elena',
        classStartTime: now.add(const Duration(minutes: 10)),
        classEndTime: now.add(const Duration(minutes: 70)),
        bookingType: 'online',
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
      );
      expect(imminentBooking.canJoinLive, isTrue);

      // Case B: 30 minutes prior to start -> LOCKED (too early)
      final earlyBooking = BookingModel(
        bookingId: 'b_early',
        userId: 'u1',
        userFullName: 'Yogi',
        userEmail: 'y@example.com',
        classId: 'c1',
        classTitle: 'Vinyasa',
        instructorName: 'Elena',
        classStartTime: now.add(const Duration(minutes: 30)),
        classEndTime: now.add(const Duration(minutes: 90)),
        bookingType: 'online',
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
      );
      expect(earlyBooking.canJoinLive, isFalse);

      // Case C: Currently underway (started 20 mins ago, ends in 40 mins) -> OPEN
      final activeBooking = BookingModel(
        bookingId: 'b_active',
        userId: 'u1',
        userFullName: 'Yogi',
        userEmail: 'y@example.com',
        classId: 'c1',
        classTitle: 'Vinyasa',
        instructorName: 'Elena',
        classStartTime: now.subtract(const Duration(minutes: 20)),
        classEndTime: now.add(const Duration(minutes: 40)),
        bookingType: 'online',
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
      );
      expect(activeBooking.canJoinLive, isTrue);

      // Case D: Class concluded 10 mins ago -> CLOSED
      final concludedBooking = BookingModel(
        bookingId: 'b_concluded',
        userId: 'u1',
        userFullName: 'Yogi',
        userEmail: 'y@example.com',
        classId: 'c1',
        classTitle: 'Vinyasa',
        instructorName: 'Elena',
        classStartTime: now.subtract(const Duration(minutes: 70)),
        classEndTime: now.subtract(const Duration(minutes: 20)),
        bookingType: 'online',
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
      );
      expect(concludedBooking.canJoinLive, isFalse);

      // Case E: Offline in-studio booking -> LOCKED regardless of time
      final offlineBooking = BookingModel(
        bookingId: 'b_offline',
        userId: 'u1',
        userFullName: 'Yogi',
        userEmail: 'y@example.com',
        classId: 'c2',
        classTitle: 'In-Studio Hatha',
        instructorName: 'Marcus',
        classStartTime: now.add(const Duration(minutes: 5)),
        classEndTime: now.add(const Duration(minutes: 65)),
        bookingType: 'offline', // Offline
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
      );
      expect(offlineBooking.canJoinLive, isFalse);
    });
  });
}

