export type UserRole = 'customer' | 'instructor' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface User {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  role: UserRole;
  status: UserStatus;
  activeMembershipId?: string;
  remainingCredits: number;
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  createdAt?: any;
  updatedAt?: any;
}

export interface Instructor {
  instructorId: string;
  userId?: string;
  name: string;
  bio: string;
  profileImage: string;
  specialties: string[];
  active: boolean;
  availability?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
}

export type BookingType = 'online' | 'offline';
export type ClassStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export interface YogaClass {
  classId: string;
  title: string;
  description: string;
  category: string;
  instructorId: string;
  instructorName: string;
  instructorImage?: string;
  bookingType: BookingType;
  startTime: string; // ISO string or formatted for frontend
  endTime: string;
  durationMinutes: number;
  capacity: number;
  bookedSeats: number;
  location?: {
    studioRoom?: string;
    address?: string;
  };
  meetingConfiguration?: {
    jitsiRoom: string;
    jitsiServer?: string;
    joinWindowMinutesBefore: number;
  };
  bookingDeadline?: string;
  cancellationPolicyHours: number;
  status: ClassStatus;
  recurrenceRule?: string;
}

export interface Package {
  packageId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  credits: number;
  validityDays: number;
  unlimited: boolean;
  eligibleCategories: string[];
  eligibleBookingTypes: BookingType[];
  startDateRules: 'immediate' | 'first_booking';
  active: boolean;
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'attended' | 'no_show';
export type PaymentStatus = 'pending' | 'paid' | 'verified' | 'rejected' | 'refunded';

export interface Booking {
  bookingId: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  classId: string;
  classTitle: string;
  instructorName: string;
  classStartTime: string;
  classEndTime: string;
  bookingType: BookingType;
  packageId?: string;
  membershipId?: string;
  creditDeducted: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface Membership {
  membershipId: string;
  userId: string;
  userName?: string;
  packageId: string;
  packageName: string;
  startDate: string;
  expiryDate: string;
  totalCredits: number;
  remainingCredits: number;
  unlimited: boolean;
  status: 'active' | 'expired' | 'depleted' | 'suspended';
  purchaseId?: string;
}

export interface Payment {
  paymentId: string;
  userId: string;
  userFullName: string;
  packageId: string;
  packageName: string;
  amount: number;
  currency: string;
  paymentMethod: 'card' | 'bank_transfer' | 'fps' | 'payme' | 'alipay' | 'simulated';
  transactionId: string;
  proofUrl?: string;
  paymentStatus: PaymentStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface StudioSettings {
  studioName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  currency: string;
  currencySymbol: string;
  timezone: string;
  cancellationPolicyHours: number;
  allowSingleClassDropIn: boolean;
  jitsiDefaultServer: string;
}

