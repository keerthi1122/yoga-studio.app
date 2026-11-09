# Cloud Firestore Database Schema Specification

## 1. Overview
The platform uses Google Cloud Firestore in native mode. All collections employ strict field types, predictable timestamps (`serverTimestamp`), and relational foreign keys.

---

## 2. Collections & Document Structures

### 2.1 `users`
Represents all system accounts (Customers, Instructors, Admins).
```typescript
interface UserDocument {
  uid: string;                    // Primary Key (Auth UID)
  fullName: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  role: 'customer' | 'instructor' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  activeMembershipId?: string;    // Pointer to current active membership
  remainingCredits: number;       // Denormalized for fast UI lookups
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

### 2.2 `instructors`
Detailed instructor profiles and bio information.
```typescript
interface InstructorDocument {
  instructorId: string;           // Document ID (matches userId if linked)
  userId?: string;
  name: string;
  bio: string;
  profileImage: string;
  specialties: string[];          // e.g. ["Vinyasa", "Hatha", "Sound Bath"]
  availability: {
    dayOfWeek: number;            // 0 = Sunday, 1 = Monday...
    startTime: string;            // "07:00"
    endTime: string;              // "19:00"
  }[];
  active: boolean;
  createdAt: FirebaseFirestore.Timestamp;
}
```

### 2.3 `classes`
Yoga classes offered online or offline.
```typescript
interface ClassDocument {
  classId: string;
  title: string;
  description: string;
  category: string;               // "Hatha", "Vinyasa", "Yin", "Ashtanga", etc.
  instructorId: string;
  instructorName: string;
  instructorImage?: string;
  bookingType: 'online' | 'offline';
  startTime: FirebaseFirestore.Timestamp;
  endTime: FirebaseFirestore.Timestamp;
  durationMinutes: number;
  capacity: number;
  bookedSeats: number;            // Monitored via transactional increment
  location?: {
    studioRoom?: string;
    address?: string;
  };
  meetingConfiguration?: {
    jitsiRoom: string;
    jitsiServer?: string;
    joinWindowMinutesBefore: number; // default: 15
    allowGuestBeforeHost: boolean;   // default: false
  };
  bookingDeadline: FirebaseFirestore.Timestamp;
  cancellationPolicy: {
    hoursBeforeClass: number;      // e.g. 12 hrs cutoff for refund/credit return
    allowCancellation: boolean;
  };
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  recurrenceRule?: string;         // 'daily' | 'weekly' | 'none'
  createdAt: FirebaseFirestore.Timestamp;
}
```

### 2.4 `packages`
Available purchase plans, class packs, and recurring passes.
```typescript
interface PackageDocument {
  packageId: string;
  name: string;
  description: string;
  price: number;
  currency: string;               // e.g. "USD", "HKD", "INR"
  credits: number;                // -1 indicates unlimited
  validityDays: number;           // e.g. 30, 90, 365
  unlimited: boolean;
  eligibleCategories: string[];   // ["all"] or specific category IDs
  eligibleBookingTypes: ('online' | 'offline')[];
  startDateRules: 'immediate' | 'first_booking';
  active: boolean;
  createdAt: FirebaseFirestore.Timestamp;
}
```

### 2.5 `memberships`
Purchased instances of packages assigned to users.
```typescript
interface MembershipDocument {
  membershipId: string;
  userId: string;
  packageId: string;
  packageName: string;
  startDate: FirebaseFirestore.Timestamp;
  expiryDate: FirebaseFirestore.Timestamp;
  totalCredits: number;
  remainingCredits: number;
  unlimited: boolean;
  status: 'active' | 'expired' | 'depleted' | 'suspended';
  purchaseId: string;             // FK to payments
  createdAt: FirebaseFirestore.Timestamp;
}
```

### 2.6 `bookings`
Individual reservations made by customers.
```typescript
interface BookingDocument {
  bookingId: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  classId: string;
  classTitle: string;
  instructorName: string;
  classStartTime: FirebaseFirestore.Timestamp;
  classEndTime: FirebaseFirestore.Timestamp;
  bookingType: 'online' | 'offline';
  packageId?: string;
  membershipId?: string;
  creditDeducted: number;
  bookingStatus: 'confirmed' | 'cancelled' | 'attended' | 'no_show';
  paymentStatus: 'paid' | 'complimentary' | 'pending';
  cancellationReason?: string;
  cancelledAt?: FirebaseFirestore.Timestamp;
  attendedAt?: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
}
```

### 2.7 `payments`
Financial transactions (online simulated/merchant and manual bank transfer).
```typescript
interface PaymentDocument {
  paymentId: string;
  userId: string;
  userFullName: string;
  packageId: string;
  packageName: string;
  amount: number;
  currency: string;
  paymentMethod: 'card' | 'bank_transfer' | 'fps' | 'payme' | 'alipay' | 'simulated';
  transactionId: string;
  proofUrl?: string;             // Storage download URL for bank transfer slips
  paymentStatus: 'pending' | 'verified' | 'rejected' | 'refunded';
  notes?: string;
  verifiedBy?: string;           // Admin UID
  verifiedAt?: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
}
```

### 2.8 `attendance`
Check-in and live attendance tracking.
```typescript
interface AttendanceDocument {
  attendanceId: string;
  bookingId: string;
  userId: string;
  classId: string;
  attendanceStatus: 'present' | 'absent' | 'late';
  joinedAt?: FirebaseFirestore.Timestamp;
  leftAt?: FirebaseFirestore.Timestamp;
  minutesInCall?: number;
  checkedInAt: FirebaseFirestore.Timestamp;
}
```

### 2.9 `activityLogs`
Immutable security and customer audit trail.
```typescript
interface ActivityLogDocument {
  logId: string;
  userId: string;
  actorRole: 'customer' | 'instructor' | 'admin' | 'system';
  action: string;                // e.g. "USER_REGISTERED", "BOOKING_CREATED", "PAYMENT_SUBMITTED"
  description: string;
  metadata?: Record<string, any>;
  timestamp: FirebaseFirestore.Timestamp;
}
```

### 2.10 `studioSettings`
Singleton document (`/studioSettings/default`) housing studio-wide configs.
```typescript
interface StudioSettingsDocument {
  studioName: string;
  tagline: string;
  logoUrl?: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  currency: string;              // default: "USD"
  currencySymbol: string;        // default: "$"
  timezone: string;              // default: "America/New_York" (or "Asia/Hong_Kong")
  cancellationPolicyHours: number; // default: 12
  allowSingleClassDropIn: boolean; // default: true
  jitsiDefaultServer: string;    // default: "meet.jit.si"
  paymentMethodsEnabled: {
    card: boolean;
    bankTransfer: boolean;
    fps: boolean;
    payme: boolean;
    simulated: boolean;
  };
  updatedAt: FirebaseFirestore.Timestamp;
}
```

---

## 3. Required Composite Indexes (`firestore.indexes.json`)
1. `classes`: `bookingType` ASC + `startTime` ASC + `status` ASC
2. `classes`: `status` ASC + `startTime` ASC
3. `bookings`: `userId` ASC + `bookingStatus` ASC + `classStartTime` DESC
4. `bookings`: `classId` ASC + `bookingStatus` ASC
5. `memberships`: `userId` ASC + `status` ASC + `expiryDate` DESC
6. `payments`: `userId` ASC + `createdAt` DESC
7. `payments`: `paymentStatus` ASC + `createdAt` DESC
8. `activityLogs`: `userId` ASC + `timestamp` DESC

