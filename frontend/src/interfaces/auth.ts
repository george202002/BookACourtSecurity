export interface AuthRequestDto {
  firebaseToken: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface AuthResponseDto {
  firebaseUid: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: string;
  subscription: string;
  emailVerified: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  rememberMe?: boolean;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}
