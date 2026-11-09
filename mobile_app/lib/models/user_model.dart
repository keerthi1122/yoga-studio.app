class UserModel {
  final String uid;
  final String fullName;
  final String email;
  final String? phone;
  final String? photoUrl;
  final String role; // 'customer', 'instructor', 'admin'
  final String status; // 'active', 'suspended'
  final String? activeMembershipId;
  final int remainingCredits;

  const UserModel({
    required this.uid,
    required this.fullName,
    required this.email,
    this.phone,
    this.photoUrl,
    this.role = 'customer',
    this.status = 'active',
    this.activeMembershipId,
    this.remainingCredits = 0,
  });

  factory UserModel.fromMap(Map<String, dynamic> data, String id) {
    return UserModel(
      uid: id,
      fullName: data['fullName'] ?? 'Yogi',
      email: data['email'] ?? '',
      phone: data['phone'],
      photoUrl: data['photoUrl'],
      role: data['role'] ?? 'customer',
      status: data['status'] ?? 'active',
      activeMembershipId: data['activeMembershipId'],
      remainingCredits: data['remainingCredits'] ?? 0,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'fullName': fullName,
      'email': email,
      'phone': phone,
      'photoUrl': photoUrl,
      'role': role,
      'status': status,
      'activeMembershipId': activeMembershipId,
      'remainingCredits': remainingCredits,
    };
  }

  UserModel copyWith({
    String? fullName,
    String? phone,
    String? photoUrl,
    String? activeMembershipId,
    int? remainingCredits,
    String? status,
  }) {
    return UserModel(
      uid: uid,
      fullName: fullName ?? this.fullName,
      email: email,
      phone: phone ?? this.phone,
      photoUrl: photoUrl ?? this.photoUrl,
      role: role,
      status: status ?? this.status,
      activeMembershipId: activeMembershipId ?? this.activeMembershipId,
      remainingCredits: remainingCredits ?? this.remainingCredits,
    );
  }
}

