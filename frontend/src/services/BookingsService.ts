import type { NavigateFunction } from "react-router-dom";
import HttpClient from "../utils/HttpClient";
import type {
  BookingRequest,
  BookingDTO,
} from "../dtos/Booking";
import type { FilterCriteria } from "../dtos/FilterCriteria";
import type { BookingStats, BookingStatsAdmin } from "../dtos/BookingStats";

export interface PaginatedBookingsResponse {
  content: BookingRequest[];
  totalElements: number;
  totalPages: number;
  number: number; // current page (0-based)
  size: number; // page size
  numberOfElements: number; // items in current page
  first: boolean;
  last: boolean;
}

export const getAdminBookings = async (
  navigate: NavigateFunction,
  filters: FilterCriteria,
): Promise<PaginatedBookingsResponse> => {
  try {
    const { page, size, ...filterBody } = filters;
    const queryParams = new URLSearchParams();

    if (page !== undefined) {
      queryParams.append("page", page.toString());
    }
    if (size !== undefined) {
      queryParams.append("size", size.toString());
    }
    const queryString = queryParams.toString();

    const response = await HttpClient.post(`/bookings/admin-bookings?${queryString}`, navigate, filterBody);

    if (!response.ok) {
      throw new Error("Failed to fetch bookings");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw error;
  }
};

export const getBookingById = async (
  id: number,
  navigate: NavigateFunction,
): Promise<BookingRequest> => {
  try {
    const response = await HttpClient.get(`/bookings/${id}`, navigate);

    if (!response.ok) {
      throw new Error("Failed to fetch booking");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching booking:", error);
    throw error;
  }
};

export const createBooking = async (
  bookingRequest: BookingRequest,
  navigate: NavigateFunction,
): Promise<BookingDTO> => {
  try {
    const response = await HttpClient.post(
      "/bookings",
      navigate,
      bookingRequest,
    );

    if (!response.ok) {
      throw new Error("Failed to create booking");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

export const joinBooking = async (
  bookingRequest: BookingRequest,
  navigate: NavigateFunction,
): Promise<BookingDTO> => {
  try {
    const response = await HttpClient.post(
      `/bookings/${bookingRequest.booking.id}/join`,
      navigate,
      bookingRequest,
    );

    if (!response.ok) {
      throw new Error("Failed to create booking");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

export const updateBooking = async (
  id: string | number,
  bookingRequest: BookingRequest,
  navigate: NavigateFunction,
): Promise<BookingRequest> => {
  try {
    const response = await HttpClient.put(
      `/bookings/${id}`,
      navigate,
      bookingRequest,
    );

    if (!response.ok) {
      throw new Error("Failed to update booking");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating booking:", error);
    throw error;
  }
};

export const deleteBooking = async (
  id: string | number,
  navigate: NavigateFunction,
): Promise<void> => {
  try {
    const response = await HttpClient.delete(`/bookings/${id}`, navigate);

    if (!response.ok) {
      throw new Error("Failed to delete booking");
    }
  } catch (error) {
    console.error("Error deleting booking:", error);
    throw error;
  }
};

export const getBookingsByDate = async (
  courtId: number,
  date: string,
  navigate: NavigateFunction,
): Promise<BookingDTO[]> => {
  try {
    const response = await HttpClient.get(
      `/bookings/by-date?courtId=${courtId}&date=${date}`,
      navigate,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch bookings for date");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching bookings for date:", error);
    throw error;
  }
};

export const getOpenBookings = async (
  navigate: NavigateFunction,
  filters: FilterCriteria,
): Promise<PaginatedBookingsResponse> => {
  try {
    const { page, size, ...filterBody } = filters;
    const queryParams = new URLSearchParams();

    if (page !== undefined) {
      queryParams.append("page", page.toString());
    }
    if (size !== undefined) {
      queryParams.append("size", size.toString());
    }

    const queryString = queryParams.toString();

    const response = await HttpClient.post(`/bookings/open?${queryString}`, navigate, filterBody);

    if (!response.ok) {
      throw new Error("Failed to fetch open bookings");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching open bookings:", error);
    throw error;
  }
};

export const getUserBookings = async (
  navigate: NavigateFunction,
  filters: FilterCriteria,
): Promise<PaginatedBookingsResponse> => {
  try {
    const { page, size, ...filterBody } = filters;
    const queryParams = new URLSearchParams();

    if (page !== undefined) {
      queryParams.append("page", page.toString());
    }
    if (size !== undefined) {
      queryParams.append("size", size.toString());
    }

    const queryString = queryParams.toString();

    const response = await HttpClient.post(`/bookings/my-bookings?${queryString}`, navigate, filterBody);

    if (!response.ok) {
      throw new Error("Failed to fetch user bookings");
    }

    return await response.json();
    } catch (error) {
    console.error("Error fetching user bookings:", error);
    throw error;
  }
};

export const getUserBookingStats = async (
  navigate: NavigateFunction,
): Promise<BookingStats> => {
  try {
    const response = await HttpClient.get(`/bookings/stats`, navigate);

    if (!response.ok) {
      throw new Error("Failed to fetch user bookings stats");
    }

    return await response.json();
    } catch (error) {
    console.error("Error fetching user bookings stats:", error);
    throw error;
  }
};

export const getAdminBookingStats = async (
  navigate: NavigateFunction,
): Promise<BookingStatsAdmin> => {
  try {
    const response = await HttpClient.get(`/bookings/admin/stats`, navigate);

    if (!response.ok) {
      throw new Error("Failed to fetch user bookings stats");
    }

    return await response.json();
    } catch (error) {
    console.error("Error fetching user bookings stats:", error);
    throw error;
  }
};

export const cancelBooking = async (
  bookingId: string,
  navigate: NavigateFunction,
): Promise<void> => {
  try {
    const response = await HttpClient.post(
      `/bookings/${bookingId}/cancel`,
      navigate,
    );

    if (!response.ok) {
      throw new Error("Failed to cancel booking");
    }
  } catch (error) {
    console.error("Error cancelling booking:", error);
    throw error;
  }
};
