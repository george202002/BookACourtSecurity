import type { Court, CourtResponse } from "../dtos/Court";
import HttpClient from "../utils/HttpClient";
import type { NavigateFunction } from "react-router-dom";
import type { FilterCriteria } from "../dtos/FilterCriteria";

export interface PaginatedCourtsResponse {
  content: CourtResponse[];
  totalElements: number;
  totalPages: number;
  number: number; // current page (0-based)
  size: number; // page size
  numberOfElements: number; // items in current page
  first: boolean;
  last: boolean;
}

export const getCourts = async (
  navigate: NavigateFunction,
  filters: FilterCriteria,
): Promise<PaginatedCourtsResponse> => {
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

    const response = await HttpClient.post(`/courts/filter?${queryString}`, navigate, filterBody);

    if (!response.ok) {
      throw new Error("Failed to fetch courts");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching filtered courts:", error);
    throw error;
  }
};

export const createCourt = async (
  courtData: { court: Omit<Court["court"], "id">; availability: Court["availability"] },
  navigate: NavigateFunction,
): Promise<Court> => {
  try {
    const response = await HttpClient.post("/courts", navigate, courtData);

    if (!response.ok) {
      throw new Error("Failed to create court");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating court:", error);
    throw error;
  }
};

export const updateCourt = async (
  id: number,
  courtData: Partial<Court>,
  navigate: NavigateFunction,
): Promise<Court> => {
  try {
    const response = await HttpClient.put(`/courts/${id}`, navigate, courtData);

    if (!response.ok) {
      throw new Error("Failed to update court");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating court:", error);
    throw error;
  }
};

export const deleteCourt = async (
  id: number,
  navigate: NavigateFunction,
): Promise<void> => {
  try {
    const response = await HttpClient.delete(`/courts/${id}`, navigate);

    if (!response.ok) {
      throw new Error("Failed to delete court");
    }
  } catch (error) {
    console.error("Error deleting court:", error);
    throw error;
  }
};

export const getCourtById = async (
  id: number,
  navigate: NavigateFunction,
): Promise<CourtResponse> => {
  try {
    const response = await HttpClient.get(`/courts/${id}`, navigate);

    if (!response.ok) {
      throw new Error("Failed to fetch court");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching court:", error);
    throw error;
  }
};
