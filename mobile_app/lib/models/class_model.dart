class ClassModel {
  final String classId;
  final String title;
  final String description;
  final String category;
  final String instructorId;
  final String instructorName;
  final String? instructorImage;
  final String bookingType; // 'online' or 'offline'
  final DateTime startTime;
  final DateTime endTime;
  final int durationMinutes;
  final int capacity;
  final int bookedSeats;
  final String? studioRoom;
  final String? studioAddress;
  final String? jitsiRoom;
  final String? jitsiServer;
  final int joinWindowMinutesBefore;
  final int cancellationPolicyHours;
  final String status; // 'scheduled', 'live', 'completed', 'cancelled'

  const ClassModel({
    required this.classId,
    required this.title,
    required this.description,
    required this.category,
    required this.instructorId,
    required this.instructorName,
    this.instructorImage,
    required this.bookingType,
    required this.startTime,
    required this.endTime,
    required this.durationMinutes,
    required this.capacity,
    required this.bookedSeats,
    this.studioRoom,
    this.studioAddress,
    this.jitsiRoom,
    this.jitsiServer,
    this.joinWindowMinutesBefore = 15,
    this.cancellationPolicyHours = 12,
    this.status = 'scheduled',
  });

  bool get isFull => bookedSeats >= capacity;
  bool get isOnline => bookingType.toLowerCase() == 'online';
  bool get isOffline => !isOnline;
  int get availableSeats => (capacity - bookedSeats).clamp(0, capacity);

  bool get canJoinLive {
    if (!isOnline) return false;
    final now = DateTime.now();
    final windowStart = startTime.subtract(Duration(minutes: joinWindowMinutesBefore));
    final windowEnd = endTime.add(const Duration(minutes: 15));
    return now.isAfter(windowStart) && now.isBefore(windowEnd) && status != 'cancelled';
  }

  factory ClassModel.fromMap(Map<String, dynamic> data, String id) {
    DateTime parseDate(dynamic val) {
      if (val == null) return DateTime.now();
      if (val is DateTime) return val;
      if (val is String) return DateTime.tryParse(val) ?? DateTime.now();
      // Firestore Timestamp support
      try {
        return (val as dynamic).toDate();
      } catch (_) {
        return DateTime.now();
      }
    }

    final loc = data['location'] as Map<String, dynamic>?;
    final meeting = data['meetingConfiguration'] as Map<String, dynamic>?;

    return ClassModel(
      classId: id,
      title: data['title'] ?? '',
      description: data['description'] ?? '',
      category: data['category'] ?? 'Hatha Yoga',
      instructorId: data['instructorId'] ?? '',
      instructorName: data['instructorName'] ?? 'Lead Instructor',
      instructorImage: data['instructorImage'],
      bookingType: data['bookingType'] ?? 'online',
      startTime: parseDate(data['startTime']),
      endTime: parseDate(data['endTime']),
      durationMinutes: data['durationMinutes'] ?? 60,
      capacity: data['capacity'] ?? 20,
      bookedSeats: data['bookedSeats'] ?? 0,
      studioRoom: loc?['studioRoom'],
      studioAddress: loc?['address'],
      jitsiRoom: meeting?['jitsiRoom'],
      jitsiServer: meeting?['jitsiServer'] ?? 'meet.jit.si',
      joinWindowMinutesBefore: meeting?['joinWindowMinutesBefore'] ?? 15,
      cancellationPolicyHours: data['cancellationPolicyHours'] ?? 12,
      status: data['status'] ?? 'scheduled',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'classId': classId,
      'title': title,
      'description': description,
      'category': category,
      'instructorId': instructorId,
      'instructorName': instructorName,
      'instructorImage': instructorImage,
      'bookingType': bookingType,
      'startTime': startTime.toIso8601String(),
      'endTime': endTime.toIso8601String(),
      'durationMinutes': durationMinutes,
      'capacity': capacity,
      'bookedSeats': bookedSeats,
      'location': {
        'studioRoom': studioRoom,
        'address': studioAddress,
      },
      'meetingConfiguration': {
        'jitsiRoom': jitsiRoom,
        'jitsiServer': jitsiServer,
        'joinWindowMinutesBefore': joinWindowMinutesBefore,
      },
      'cancellationPolicyHours': cancellationPolicyHours,
      'status': status,
    };
  }
}

