import type {
  CourtType,
  CourtEnvironment,
  GreekCity,
} from "../enums/CourtEnums";

// Backend and frontend now use the same format
export interface CourtResponse {
  id: number;
  name: string;
  city: GreekCity;
  address: string;
  mapsLink: string;
  price: number;
  description: string;
  active: boolean;
  courtType: CourtType;
  environment: CourtEnvironment;
  ownerId: number;
  slotDuration: number; // Duration in hours (0.5 to 3)
  availability: {
    monday: { periods: TimePeriod[]; available: boolean };
    tuesday: { periods: TimePeriod[]; available: boolean };
    wednesday: { periods: TimePeriod[]; available: boolean };
    thursday: { periods: TimePeriod[]; available: boolean };
    friday: { periods: TimePeriod[]; available: boolean };
    saturday: { periods: TimePeriod[]; available: boolean };
    sunday: { periods: TimePeriod[]; available: boolean };
  };
}

// Time period interface for multiple periods per day
export interface TimePeriod {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  id?: string; // For frontend management (not sent to backend)
}

// Frontend format for forms (sending to backend)
export interface Court {
  court: {
    id: number;
    name: string;
    city: GreekCity;
    address: string;
    mapsLink: string;
    price: number;
    description: string;
    active: boolean;
    courtType: CourtType;
    environment: CourtEnvironment;
    slotDuration: number; // Duration in hours (0.5 to 3)
  };
  availability: {
    monday: { periods: TimePeriod[]; available: boolean };
    tuesday: { periods: TimePeriod[]; available: boolean };
    wednesday: { periods: TimePeriod[]; available: boolean };
    thursday: { periods: TimePeriod[]; available: boolean };
    friday: { periods: TimePeriod[]; available: boolean };
    saturday: { periods: TimePeriod[]; available: boolean };
    sunday: { periods: TimePeriod[]; available: boolean };
  };
}