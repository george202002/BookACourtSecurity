import type { NavigateFunction } from "react-router-dom";
import HttpClient from "../utils/HttpClient";

export interface SupportRequest {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}

export const submitSupportRequest = async (
  supportData: SupportRequest,
  navigate: NavigateFunction,
) => {
  try {
    const response = await HttpClient.post(
      "/support/submit",
      navigate,
      supportData,
      true,
    );

    return response;
  } catch (error) {
    console.error("Error submitting support request:", error);
    throw error;
  }
};
