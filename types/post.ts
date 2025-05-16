import { Timestamp } from 'firebase/firestore';

export interface Post {
  id?: string; // Firestore document ID, will be auto-generated
  userId: string; // UID of the user who created the post
  userName?: string; // Name of the user (for easy display)
  userProfilePic?: string; // Optional: URL of creator's profile pic
  title?: string; // Optional: A title for the event/post
  description: string; // Main content of the post/event
  eventDate: Timestamp; // Firestore Timestamp for when the event is happening
  createdAt: Timestamp; // Firestore Timestamp for when the post was created
  // You could add other fields like 'location', 'category', 'imageUrl' for the post itself, etc.
}