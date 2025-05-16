import { Timestamp } from 'firebase/firestore';

export type DocumentRequestStatus = 'Pending' | 'Processing' | 'On Hold' | 'Ready for Pickup' | 'Released' | 'Cancelled' | 'Rejected';
export type DocumentTypeName = 'Barangay Clearance' | 'Certificate of Indigency' | 'Cedula' | 'Business Clearance' | 'Facility Reservation'; // Add more as needed

export interface DocumentRequest {
  id?: string; // Firestore document ID
  userId: string; // UID of the user who made the request
  userName?: string; // Name of the user (optional, for admin view perhaps)
  
  requestId: string; // Custom Request ID like "503" (you'll need a system to generate this)
  documentName: DocumentTypeName; // e.g., "Barangay Clearance"
  purpose: string; // e.g., "For employment"
  
  dateRequested: Timestamp;
  fee: number; // Store as a number, e.g., 50.00
  status: DocumentRequestStatus;
  dateReleased?: Timestamp | null; // Null if not yet released
  
  // Add any other specific fields needed for different request types if not too varied,
  // or store them in a nested object.
  // e.g., facilityDetails: { facilityName: string, eventDate: Timestamp, ... } for reservations
}