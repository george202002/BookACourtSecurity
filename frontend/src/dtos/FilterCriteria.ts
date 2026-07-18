import type { CourtEnvironment, CourtType } from "../enums/CourtEnums";
import type { GreekCity } from "../enums/CourtEnums";
import type { BookingDTO } from "./Booking";

export interface FilterCriteria {
  searchTerm?: string;
  status?: BookingDTO["status"];
  city?: GreekCity;
  courtType?: CourtType;
  environment?: CourtEnvironment;
  minPrice?: number;
  maxPrice?: number;
  courtId?: number;
  dateFrom?: string; // ISO date format (YYYY-MM-DD) for ZonedDateTime parsing
  dateTo?: string; // ISO date format (YYYY-MM-DD) for ZonedDateTime parsing
  page?: number;
  size?: number;
  admin: boolean;
}
