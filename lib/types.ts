// HouseHelp TypeScript Type Definitions

// ============================================
// USER TYPES
// ============================================

export interface Worker {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address?: string;
  date_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  national_id?: string;
  district?: string;
  sector?: string;
  gps_location?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  profile_photo_url?: string;
  status: 'verifying' | 'active' | 'suspended' | 'inactive';
  verification_status: 'pending' | 'verified' | 'rejected';
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface Household {
  id: string;
  name: string;
  email: string;
  phone: string;
  alternative_contact?: string;
  address?: string;
  district?: string;
  sector?: string;
  landmark?: string;
  gps_location?: string;
  property_type?: 'House' | 'Apartment' | 'Villa';
  number_of_rooms?: number;
  has_garden?: boolean;
  has_parking?: boolean;
  special_features?: string;
  profile_photo_url?: string;
  status: 'verifying' | 'active' | 'suspended' | 'inactive';
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Admin {
  id: string;
  email: string;
  name?: string;
  role: 'super_admin' | 'admin' | 'moderator';
  created_at: string;
}

// ============================================
// SERVICE TYPES
// ============================================

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  price: number;
  duration?: string;
  created_at: string;
}

// ============================================
// BOOKING & JOB TYPES
// ============================================

export interface Booking {
  id: string;
  household_id: string;
  worker_id?: string;
  service: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  scheduled_at: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
}

export interface Job {
  id: string;
  household_id: string;
  worker_id?: string;
  service: string;
  status: 'pending' | 'assigned' | 'active' | 'completed' | 'cancelled';
  scheduled_at: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface Payment {
  id: string;
  household_id: string;
  worker_id?: string;
  booking_id?: string;
  amount: number;
  platform_fee: number;
  tax: number;
  payout?: number;
  method: 'mobile_money' | 'card' | 'bank_transfer' | 'cash';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string;
  created_at: string;
  processed_at?: string;
}

export interface Payout {
  id: string;
  worker_id: string;
  amount: number;
  method: 'mobile_money' | 'bank_transfer';
  status: 'requested' | 'processing' | 'completed' | 'failed';
  account_details?: string;
  created_at: string;
  processed_at?: string;
}

// ============================================
// SUBSCRIPTION TYPES
// ============================================

export interface HouseholdSubscription {
  id: string;
  household_id: string;
  plan: 'basic' | 'premium' | 'enterprise';
  plan_id?: string;
  status: 'active' | 'expired' | 'cancelled';
  expiry_date?: string;
  usage?: string;
  benefits?: string;
  created_at: string;
}

// ============================================
// TRAINING TYPES
// ============================================

export interface TrainingModule {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  content?: string;
  video_url?: string;
  created_at: string;
}

export interface WorkerTrainingAssignment {
  id: string;
  worker_id: string;
  module_id: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'failed';
  due_at?: string;
  completed_at?: string;
  score?: number;
  created_at: string;
}

// ============================================
// RATING & REVIEW TYPES
// ============================================

export interface WorkerRating {
  id: string;
  household_id: string;
  worker_id: string;
  booking_id?: string;
  rating: number; // 1-5
  comment?: string;
  created_at: string;
}

// ============================================
// MESSAGING TYPES
// ============================================

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  sender: string;
  content: string;
  preview?: string;
  is_read?: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  household_id?: string;
  worker_id?: string;
  title: string;
  message?: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  is_read?: boolean;
  created_at: string;
}

// ============================================
// REPORT TYPES
// ============================================

export interface Report {
  id: string;
  household_id?: string;
  worker_id?: string;
  type: 'behavior' | 'system' | 'payment' | 'other';
  subject?: string;
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'closed';
  resolution?: string;
  resolved_at?: string;
  created_at: string;
}

// ============================================
// AUTHENTICATION TYPES
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  user_type: 'worker' | 'household' | 'admin';
  name?: string;
  phone?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  userType: 'worker' | 'household' | 'admin';
  iat?: number;
  exp?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  user_type: 'worker' | 'household' | 'admin';
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
  name?: string;
  phone: string;
  user_type: 'worker' | 'household';
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  item?: T;
  items?: T[];
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  ok: boolean;
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================
// DASHBOARD SUMMARY TYPES
// ============================================

export interface WorkerDashboardSummary {
  today?: Job[];
  upcoming?: Job[];
  earnings?: {
    day: number;
    week: number;
    month: number;
  };
  training?: WorkerTrainingAssignment[];
  ratings?: WorkerRating[];
  messages?: Message[];
  notifications?: Notification[];
}

export interface HouseholdDashboardSummary {
  upcoming?: Booking[];
  recentBookings?: Booking[];
  subscription?: HouseholdSubscription;
  lastPayment?: Payment;
  messages?: Message[];
  notifications?: Notification[];
  reviews?: WorkerRating[];
}

export interface AdminMetrics {
  active_workers?: number;
  active_households?: number;
  workers_verifying?: number;
  households_verifying?: number;
  suspended_accounts?: number;
  open_jobs?: number;
  pending_jobs?: number;
  cancelled_jobs?: number;
  completed_jobs_7d?: number;
  payments_sum_window?: number;
  payments_count_window?: number;
  fees_sum_window?: number;
  payout_sum_window?: number;
  pending_payouts_count?: number;
}

// ============================================
// FORM TYPES
// ============================================

export interface WorkerRegistrationStep1 {
  full_name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  national_id: string;
  district?: string;
  sector?: string;
  address?: string;
  gps_location?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  profile_photo?: File;
}

export interface HouseholdRegistrationStep1 {
  full_name: string;
  phone: string;
  email: string;
  alternative_contact?: string;
  district?: string;
  sector?: string;
  address?: string;
  landmark?: string;
  gps_location?: string;
  property_type?: string;
  number_of_rooms?: number;
  has_garden?: boolean;
  has_parking?: boolean;
  special_features?: string;
  profile_photo?: File;
}

// ============================================
// UTILITY TYPES
// ============================================

export type UserType = 'worker' | 'household' | 'admin';
export type Status = 'verifying' | 'active' | 'suspended' | 'inactive';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type JobStatus = 'pending' | 'assigned' | 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'mobile_money' | 'card' | 'bank_transfer' | 'cash';
export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';
export type ReportType = 'behavior' | 'system' | 'payment' | 'other';
export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'closed';
