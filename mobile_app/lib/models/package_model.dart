class PackageModel {
  final String packageId;
  final String name;
  final String description;
  final double price;
  final String currency;
  final int credits; // -1 for unlimited
  final int validityDays;
  final bool unlimited;
  final List<String> eligibleCategories;
  final List<String> eligibleBookingTypes;
  final String startDateRules; // 'immediate' or 'first_booking'
  final bool active;

  const PackageModel({
    required this.packageId,
    required this.name,
    required this.description,
    required this.price,
    required this.currency,
    required this.credits,
    required this.validityDays,
    required this.unlimited,
    required this.eligibleCategories,
    required this.eligibleBookingTypes,
    required this.startDateRules,
    required this.active,
  });

  factory PackageModel.fromMap(Map<String, dynamic> data, String id) {
    return PackageModel(
      packageId: id,
      name: data['name'] ?? '',
      description: data['description'] ?? '',
      price: (data['price'] as num?)?.toDouble() ?? 0.0,
      currency: data['currency'] ?? 'USD',
      credits: data['credits'] ?? 1,
      validityDays: data['validityDays'] ?? 30,
      unlimited: data['unlimited'] ?? false,
      eligibleCategories: List<String>.from(data['eligibleCategories'] ?? ['all']),
      eligibleBookingTypes: List<String>.from(data['eligibleBookingTypes'] ?? ['online', 'offline']),
      startDateRules: data['startDateRules'] ?? 'immediate',
      active: data['active'] ?? true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'packageId': packageId,
      'name': name,
      'description': description,
      'price': price,
      'currency': currency,
      'credits': credits,
      'validityDays': validityDays,
      'unlimited': unlimited,
      'eligibleCategories': eligibleCategories,
      'eligibleBookingTypes': eligibleBookingTypes,
      'startDateRules': startDateRules,
      'active': active,
    };
  }
}

