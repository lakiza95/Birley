export type UserRole = 'admin' | 'partner' | 'institution';

export type UserStatus = 
  | 'CREATED' 
  | 'EMAIL_VERIFIED' 
  | 'PROFILE_COMPLETED' 
  | 'PENDING_DOCS' 
  | 'UNDER_REVIEW' 
  | 'ACTIVE' 
  | 'REJECTED'
  | 'ARCHIVED';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  country?: string;
  city?: string;
  bio?: string;
  agency?: string;
  balance?: number;
  school_commission_rate?: number;
  recruiter_commission_rate?: number;
  is_verified?: boolean;
  experience?: string;
  markets?: string[];
  studentsPerYear?: string;
  onboarding_completed?: boolean;
  region?: string;
  referralCode?: string;
  mailing_address?: string;
  organization_address?: string;
  tax_id?: string;
  website?: string;
  createdAt?: string;
  updatedAt?: string;
  institution_id?: string;
  referred_by_institution_id?: string;
  timezone?: string;
  name?: string;
  payment_model?: 'full_upfront' | 'split_payment' | 'platform';
  first_payment_percent?: number;
  second_payment_deadline_days?: number;
  email_notifications?: boolean;
}

export type StudentStatus = 'New Student' | 'Follow up' | 'Ready to apply' | 'Application started' | 'Action Required' | 'Application accepted' | 'Waiting payment' | 'Payment received' | 'Ready for visa' | 'Waiting visa' | 'Visa Approved' | 'Done' | 'Refund';

export type ApplicationStatus = 'New application' | 'In review' | 'Action Required' | 'Approved' | 'Rejected' | 'Waiting payment' | 'Payment received' | 'Ready for visa' | 'Visa Approved' | 'Done' | 'Refund' | 'Cancelled';

export interface Student {
  id: string;
  name: string;
  email: string;
  country: string;
  program: string;
  status: StudentStatus;
  avatar?: string;
  documents: {
    name: string;
    status: 'uploaded' | 'missing' | 'pending';
  }[];
  preferences: {
    budget: number;
    languageLevels: {
      language: string;
      level: string;
    }[];
  };
}

export interface Activity {
  id: string;
  studentName: string;
  action: string;
  timestamp: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  type: 'missing_doc' | 'deadline' | 'enrollment';
  studentName: string;
  actionLabel: string;
}

export interface School {
  id: string;
  name: string;
  location: string;
  image: string;
  programs: string[];
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

export interface Chat {
  id: string;
  type: 'platform' | 'school';
  participants: string[];
  adminId?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  // For school chats
  studentName?: string;
  studentId?: string;
  applicationId?: string;
  dbApplicationId?: string;
  schoolName?: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'active' | 'closed';
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
}

export interface Program {
  id: string;
  institution_id: string;
  name: string;
  level: string;
  duration?: string;
  intake?: string;
  status: 'Active' | 'Pending' | 'Inactive';
  vacancies: number;
  tuition_fee: number;
  currency: string;
  description?: string;
  specialization?: string;
  language?: string;
  start_date?: string;
  end_date?: string;
  visa_suitability?: string;
  min_age?: number;
  max_age?: number;
  language_certificate_required?: boolean;
  min_language_score?: number;
  experience_required?: boolean;
  enrollment_deadline?: string;
  created_at?: string;
}
