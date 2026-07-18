// User interface - compatible with both old and new auth
export interface User {
  id: string; // firebaseUid
  firebaseUid: string;
  email: string;
  fullName: string;
  firstName: string; // Extracted from fullName
  lastName: string; // Extracted from fullName
  phone: string; // phoneNumber
  phoneNumber: string | null;
  role: string;
  subscription?: string;
  emailVerified?: boolean;
}

// Helper to create a User from backend response
export function createUserFromResponse(response: {
  firebaseUid: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: string;
  subscription?: string;
  emailVerified?: boolean;
}): User {
  const nameParts = response.fullName?.split(" ") || [""];
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  return {
    id: response.firebaseUid,
    firebaseUid: response.firebaseUid,
    email: response.email,
    fullName: response.fullName,
    firstName,
    lastName,
    phone: response.phoneNumber || "",
    phoneNumber: response.phoneNumber,
    role: response.role,
    subscription: response.subscription,
    emailVerified: response.emailVerified,
  };
}
