class ActivityLogModel {
  final String logId;
  final String userId;
  final String actorRole;
  final String action;
  final String description;
  final DateTime timestamp;

  const ActivityLogModel({
    required this.logId,
    required this.userId,
    required this.actorRole,
    required this.action,
    required this.description,
    required this.timestamp,
  });

  factory ActivityLogModel.fromMap(Map<String, dynamic> data, String id) {
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

    return ActivityLogModel(
      logId: id,
      userId: data['userId'] ?? '',
      actorRole: data['actorRole'] ?? 'customer',
      action: data['action'] ?? '',
      description: data['description'] ?? '',
      timestamp: parseDate(data['timestamp']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'logId': logId,
      'userId': userId,
      'actorRole': actorRole,
      'action': action,
      'description': description,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

