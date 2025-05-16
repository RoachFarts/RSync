// types/pet.ts (or add to types/user.ts)
import { Timestamp } from 'firebase/firestore';

export interface Pet {
  id: string; // Firestore document ID
  name: string;
  type: string; // e.g., "Dog", "Cat"
  breed?: string;
  birthdate?: Timestamp; // Store as Firestore Timestamp
  imageUrl?: string; // URL to the pet's image
  // Add any other fields you need for a pet
}