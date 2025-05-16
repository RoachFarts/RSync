import { Timestamp } from 'firebase/firestore';

export interface LostFoundItem {
  id?: string; // Firestore document ID
  userId: string; // UID of the user who reported it
  userName?: string; // Name of the reporter (for display)
  userContact?: string; // Optional contact info provided by user for this item
  
  type: 'lost' | 'found'; // Is it a 'lost' item or a 'found' item?
  itemName: string; // Name or title of the item (e.g., "Black Leather Wallet")
  description: string;
  imageUrl?: string; // URL of the item's image (if images are implemented)
  
  dateReported: Timestamp; // When this report was created
  dateLostOrFound?: Timestamp; // Actual date the item was lost/found (can be different)
  locationLostOrFound?: string; // Where it was lost/found
  
  status: 'active' | 'resolved' | 'flagged'; // To manage the item lifecycle
}