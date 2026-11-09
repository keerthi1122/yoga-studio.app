class StudioAddress {
  final String street;
  final String city;
  final String state;
  final String postalCode;
  final String country;

  const StudioAddress({
    this.street = '108 Mindfulness Way, Suite 4B',
    this.city = 'San Francisco',
    this.state = 'CA',
    this.postalCode = '94107',
    this.country = 'United States',
  });

  factory StudioAddress.fromMap(Map<String, dynamic>? data) {
    if (data == null) return const StudioAddress();
    return StudioAddress(
      street: data['street'] ?? '108 Mindfulness Way, Suite 4B',
      city: data['city'] ?? 'San Francisco',
      state: data['state'] ?? 'CA',
      postalCode: data['postalCode'] ?? '94107',
      country: data['country'] ?? 'United States',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'street': street,
      'city': city,
      'state': state,
      'postalCode': postalCode,
      'country': country,
    };
  }

  String get fullAddress => '$street, $city, $state $postalCode, $country';
}

class StudioSettingsModel {
  final String studioName;
  final String tagline;
  final String contactEmail;
  final String contactPhone;
  final StudioAddress address;
  final String currency;
  final String currencySymbol;
  final String timezone;
  final int cancellationPolicyHours;
  final bool allowSingleClassDropIn;
  final String jitsiDefaultServer;

  const StudioSettingsModel({
    this.studioName = 'Prana Sanctuary Yoga & Wellness',
    this.tagline = 'Mindful breathing, alignment, and holistic movement.',
    this.contactEmail = 'contact@pranasanctuary.com',
    this.contactPhone = '+1 (555) 789-0123',
    this.address = const StudioAddress(),
    this.currency = 'USD',
    this.currencySymbol = '\$',
    this.timezone = 'America/Los_Angeles',
    this.cancellationPolicyHours = 12,
    this.allowSingleClassDropIn = true,
    this.jitsiDefaultServer = 'meet.jit.si',
  });

  factory StudioSettingsModel.fromMap(Map<String, dynamic>? data) {
    if (data == null) return const StudioSettingsModel();
    return StudioSettingsModel(
      studioName: data['studioName'] ?? 'Prana Sanctuary Yoga & Wellness',
      tagline: data['tagline'] ?? 'Mindful breathing, alignment, and holistic movement.',
      contactEmail: data['contactEmail'] ?? 'contact@pranasanctuary.com',
      contactPhone: data['contactPhone'] ?? '+1 (555) 789-0123',
      address: StudioAddress.fromMap(data['address'] as Map<String, dynamic>?),
      currency: data['currency'] ?? 'USD',
      currencySymbol: data['currencySymbol'] ?? '\$',
      timezone: data['timezone'] ?? 'America/Los_Angeles',
      cancellationPolicyHours: (data['cancellationPolicyHours'] as num?)?.toInt() ?? 12,
      allowSingleClassDropIn: data['allowSingleClassDropIn'] ?? true,
      jitsiDefaultServer: data['jitsiDefaultServer'] ?? 'meet.jit.si',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'studioName': studioName,
      'tagline': tagline,
      'contactEmail': contactEmail,
      'contactPhone': contactPhone,
      'address': address.toMap(),
      'currency': currency,
      'currencySymbol': currencySymbol,
      'timezone': timezone,
      'cancellationPolicyHours': cancellationPolicyHours,
      'allowSingleClassDropIn': allowSingleClassDropIn,
      'jitsiDefaultServer': jitsiDefaultServer,
    };
  }
}

