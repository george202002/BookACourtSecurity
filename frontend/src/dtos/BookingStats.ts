import type { BookingRequest } from "./Booking";

export interface BookingStats {
  totalBookings: number;
  upcomingBookingsCount: number;
  upcomingBookings: BookingRequest[];
  completedBookings: number;
  cancelledBookings: number;
  thisMonthSpent: number;
}

export interface BookingStatsAdmin {
  totalBookings: number;
  totalActiveCourts: number;
  todaysRevenue: number;
  openBookingsCount: number;
  recentBookings: BookingRequest[];
}
