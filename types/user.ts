import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  fullName?: string; // Added
  contactNo?: string; // Added
  address?: string; // Added
  agreedToTerms?: boolean; // Renamed from idVerifiedCheck for clarity, represents checkbox
  status: 'pending_approval' | 'approved' | 'rejected' | 'active';
  createdAt: Timestamp;
  // User Types
    role?: 'admin' | 'user'; // Add role, make it optional
}