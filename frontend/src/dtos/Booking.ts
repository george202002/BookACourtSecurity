import type { CourtResponse } from "./Court";
import type { User } from "./User";

export interface BookingRequest {
  booking: BookingDTO;
  players: Players[];
  priceInCents?: number;
}
export interface BookingDTO {
  id: string;
  court: Omit<CourtResponse, "availability">; // Reference to the court
  dateTime: string; // ISO timestamp (corresponds to date_time field in DB)
  user: User; // Always required - admin ID for external users
  status: "FILLED" | "OPEN" | "CANCELLED" | "PENDING" | "COMPLETED" | "all";
  notes?: string;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

export interface Players {
  userId?: string;
  playerName: string; // Full name of the player
  playerPhone: string; // Phone number of the player
  playerEmail?: string; // Optional email of the player
  addedBy: string; // User who added the player
}
