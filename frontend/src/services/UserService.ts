import type { NavigateFunction } from "react-router-dom";
import HttpClient from "../utils/HttpClient";

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber: string;
}

export const updateProfile = async (
  profileData: UpdateProfileRequest,
  navigate: NavigateFunction,
) => {
  const response = await HttpClient.post(
    "/user/update-profile",
    navigate,
    profileData,
    true,
  );
  return response;
};

// Note: Password changes are now handled by Firebase Auth
// Users can use the "Forgot Password" flow to reset their password
// or change it in their Firebase account settings
