class BookingModel {
  final String bookingId;
  final String userId;
  final String userFullName;
  final String userEmail;
  final String classId;
  final String classTitle;
  final String instructorName;
  final DateTime classStartTime;
  final DateTime classEndTime;
  final String bookingType; // 'online' or 'offline'
  final String? packageId;
  final String? membershipId;
  final int creditDeducted;
  final String bookingStatus; // 'confirmed', 'cancelled', 'attended', 'no_show'
  final String paymentStatus; // 'paid', 'pending', 'complimentary', 'refunded'
  final String? cancellationReason;
  final DateTime? cancelledAt;
  final String? jitsiRoom;
  final String? studioRoom;
  final String? studioAddress;

  const BookingModel({
    required this.bookingId,
    required this.userId,
    required this.userFullName,
    required this.userEmail,
    required this.classId,
    required this.classTitle,
    required this.instructorName,
    required this.classStartTime,
    required this.classEndTime,
    required this.bookingType,
    this.packageId,
    this.membershipId,
    this.creditDeducted = 1,
    required this.bookingStatus,
    required this.paymentStatus,
    this.cancellationReason,
    this.cancelledAt,
    this.jitsiRoom,
    this.studioRoom,
    this.studioAddress,
  });

  bool get isConfirmed => bookingStatus == 'confirmed';
  bool get isCancelled => bookingStatus == 'cancelled';
  bool get isOnline => bookingType.toLowerCase() == 'online';

  bool get canJoinLive {
    if (!isOnline || !isConfirmed) return false;
    final now = DateTime.now();
    final windowStart = classStartTime.subtract(const Duration(minutes: 15));
    final windowEnd = classEndTime.add(const Duration(minutes: 15));
    return now.isAfter(windowStart) && now.isBefore(windowEnd);
  }

  factory BookingModel.fromMap(Map<String, dynamic> data, String id) {
    DateTime parseDate(dynamic val) {
      if (val == null) return DateTime.now();
      if (val is DateTime) return val;
      if (val is String) return DateTime.tryParse(val) ?? DateTime.now();
      try {
        return (val as dynamic).toDate();
      } catch (_) {
        return DateTime.now();
      }
    }

    return BookingModel(
      bookingId: id,
      userId: data['userId'] ?? '',
      userFullName: data['userFullName'] ?? '',
      userEmail: data['userEmail'] ?? '',
      classId: data['classId'] ?? '',
      classTitle: data['classTitle'] ?? '',
      instructorName: data['instructorName'] ?? '',
      classStartTime: parseDate(data['classStartTime']),
      classEndTime: parseDate(data['classEndTime']),
      bookingType: data['bookingType'] ?? 'online',
      packageId: data['packageId'],
      membershipId: data['membershipId'],
      creditDeducted: data['creditDeducted'] ?? 1,
      bookingStatus: data['bookingStatus'] ?? 'confirmed',
      paymentStatus: data['paymentStatus'] ?? 'paid',
      cancellationReason: data['cancellationReason'],
      cancelledAt: data['cancelledAt'] != null ? parseDate(data['cancelledAt']) : null,
      jitsiRoom: data['jitsiRoom'],
      studioRoom: data['studioRoom'],
      studioAddress: data['studioAddress'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'bookingId': bookingId,
      'userId': userId,
      'userFullName': userFullName,
      'userEmail': userEmail,
      'classId': classId,
      'classTitle': classTitle,
      'instructorName': instructorName,
      'classStartTime': classStartTime.toIso8601String(),
      'classEndTime': classEndTime.toIso8601String(),
      'bookingType': bookingType,
      'packageId': packageId,
      'membershipId': membershipId,
      'creditDeducted': creditDeducted,
      'bookingStatus': bookingStatus,
      'paymentStatus': paymentStatus,
      'cancellationReason': cancellationReason,
      'cancelledAt': cancelledAt?.toIso8601String(),
      'jitsiRoom': jitsiRoom,
      'studioRoom': studioRoom,
      'studioAddress': studioAddress,
    };
  }
}

