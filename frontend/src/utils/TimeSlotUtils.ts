import type { CourtResponse } from "../dtos/Court";
import type { BookingDTO } from "../dtos/Booking";

export interface TimeSlot {
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  available: boolean;
  unavailableReason?: 'booked' | 'past'; // Reason why slot is unavailable
}

/**
 * Generates time slots for a court based on its booking duration and availability schedule
 * Now supports multiple periods per day
 */
export const generateTimeSlots = (
  court: CourtResponse,
  selectedDate: string, // YYYY-MM-DD format
  existingBookings: BookingDTO[] = []
): TimeSlot[] => {
  const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof CourtResponse["availability"];

  // Get the day's availability
  const dayAvailability = court.availability[dayOfWeek];

  if (!dayAvailability || !dayAvailability.available || dayAvailability.periods.length === 0) {
    return []; // Court is closed on this day
  }

  const allSlots: TimeSlot[] = [];
  const slotDuration = court.slotDuration; // Duration in hours
  const slotDurationMinutes = slotDuration * 60; // Convert to minutes

  // Check if selected date is today
  const today = new Date();
  const selectedDateObj = new Date(selectedDate);
  const isToday = selectedDateObj.toDateString() === today.toDateString();

  // Get current time in minutes if today
  const currentTimeMinutes = isToday ? (today.getHours() * 60 + today.getMinutes()) : 0;

  // Generate slots for each availability period
  for (const period of dayAvailability.periods) {
    // Parse open and close times for this period
    const openTime = parseTime(period.startTime);
    const closeTime = parseTime(period.endTime);

    // Generate slots from open to close time for this period
    let currentTime = openTime;

    while (currentTime + slotDurationMinutes <= closeTime) {
      const slotStart = formatTime(currentTime);
      const slotEnd = formatTime(currentTime + slotDurationMinutes);

      // Check if this slot is in the past (for today only) (up to 1 hour before slot time)
      const isPastSlot = isToday && currentTime < currentTimeMinutes + 60;

      // Check if this slot is already booked (only consider OPEN, FILLED and PENDING bookings)
      const isBooked = existingBookings
        .filter(booking => booking.status === 'OPEN' || booking.status === 'FILLED' || booking.status === 'PENDING')
        .some(booking => {
          const bookingDate = new Date(booking.dateTime);
          const bookingDateStr = bookingDate.toISOString().split('T')[0]; // YYYY-MM-DD

          if (bookingDateStr !== selectedDate) {
            return false;
          }

          // Extract start time from dateTime
          const bookingStartTime = bookingDate.toTimeString().substring(0, 5); // HH:mm
          // Calculate end time based on court's slot duration
          const endDateTime = new Date(bookingDate.getTime() + (court.slotDuration * 60 * 60 * 1000));
          const bookingEndTime = endDateTime.toTimeString().substring(0, 5); // HH:mm

          return timeOverlaps(slotStart, slotEnd, bookingStartTime, bookingEndTime);
        });

      allSlots.push({
        startTime: slotStart,
        endTime: slotEnd,
        available: !isBooked && !isPastSlot,
        unavailableReason: isPastSlot ? 'past' : (isBooked ? 'booked' : undefined)
      });

      currentTime += slotDurationMinutes;
    }
  }

  // Sort slots by start time to ensure proper ordering
  return allSlots.sort((a, b) => {
    const timeA = parseTime(a.startTime);
    const timeB = parseTime(b.startTime);
    return timeA - timeB;
  });
};

/**
 * Parse time string (HH:MM:SS or HH:MM) to minutes since midnight
 */
const parseTime = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Format minutes since midnight to HH:mm format
 */
const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Check if two time ranges overlap
 */
const timeOverlaps = (
  start1: string, 
  end1: string, 
  start2: string, 
  end2: string
): boolean => {
  const start1Minutes = parseTime(start1);
  const end1Minutes = parseTime(end1);
  const start2Minutes = parseTime(start2);
  const end2Minutes = parseTime(end2);
  
  return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
};

/**
 * Format time for display (e.g., "14:30" -> "2:30 PM")
 */
export const formatTimeDisplay = (timeString: string): string => {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("el-GR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
