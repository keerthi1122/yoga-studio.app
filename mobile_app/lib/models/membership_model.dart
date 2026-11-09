class MembershipModel {
  final String membershipId;
  final String userId;
  final String packageId;
  final String packageName;
  final DateTime startDate;
  final DateTime expiryDate;
  final int totalCredits;
  final int remainingCredits;
  final bool unlimited;
  final String status; // 'active', 'expired', 'depleted', 'suspended'

  const MembershipModel({
    required this.membershipId,
    required this.userId,
    required this.packageId,
    required this.packageName,
    required this.startDate,
    required this.expiryDate,
    required this.totalCredits,
    required this.remainingCredits,
    required this.unlimited,
    required this.status,
  });

  bool get isValid {
    final now = DateTime.now();
    return status == 'active' && now.isBefore(expiryDate) && (unlimited || remainingCredits > 0);
  }

  factory MembershipModel.fromMap(Map<String, dynamic> data, String id) {
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

    return MembershipModel(
      membershipId: id,
      userId: data['userId'] ?? '',
      packageId: data['packageId'] ?? '',
      packageName: data['packageName'] ?? '',
      startDate: parseDate(data['startDate']),
      expiryDate: parseDate(data['expiryDate']),
      totalCredits: data['totalCredits'] ?? 0,
      remainingCredits: data['remainingCredits'] ?? 0,
      unlimited: data['unlimited'] ?? false,
      status: data['status'] ?? 'active',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'membershipId': membershipId,
      'userId': userId,
      'packageId': packageId,
      'packageName': packageName,
      'startDate': startDate.toIso8601String(),
      'expiryDate': expiryDate.toIso8601String(),
      'totalCredits': totalCredits,
      'remainingCredits': remainingCredits,
      'unlimited': unlimited,
      'status': status,
    };
  }
}

