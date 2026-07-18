import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "../dtos/User";

// Must match the key AuthService writes the logged-in user to
const USER_STORAGE_KEY = "user";

const TokenUtils = {
  /**
   * Gets the Firebase ID token for API requests.
   * Redirects to home page if no user is authenticated.
   * @param navigate - The navigation function to redirect the user.
   * @returns Promise<string | null> - The Firebase ID token or null if unavailable.
   */
  getToken: async (navigate: (path: string) => void): Promise<string | null> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      navigate("/");
      return null;
    }

    try {
      const token = await firebaseUser.getIdToken();
      if (!token) {
        navigate("/");
        return null;
      }
      return token;
    } catch (error) {
      console.error("Error getting Firebase token:", error);
      navigate("/");
      return null;
    }
  },

  /**
   * Checks if the user is authenticated.
   * @returns boolean - True if user is authenticated, false otherwise.
   */
  isAuthenticated: (): boolean => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored !== null && auth.currentUser !== null;
  },

  /**
   * Checks if the token/session has expired.
   * With Firebase, we rely on Firebase's built-in token refresh.
   * @param _navigate - The navigation function (unused, kept for API compatibility).
   * @returns Promise<boolean> - True if expired/not authenticated, false otherwise.
   */
  isTokenExpired: async (_navigate: (path: string) => void): Promise<boolean> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return true;
    }

    try {
      // Try to get a fresh token - Firebase handles expiration automatically
      const token = await firebaseUser.getIdToken();
      return !token;
    } catch (error) {
      console.error("Token validation error:", error);
      return true;
    }
  },

  /**
   * Returns the user's role from stored user data.
   * @param _navigate - The navigation function (unused, kept for API compatibility).
   * @returns Promise<string | undefined> - The user's role.
   */
  getRole: async (_navigate: (path: string) => void): Promise<string | undefined> => {
    const user = TokenUtils.getStoredUser();
    return user?.role;
  },

  /**
   * Retrieves user details from localStorage.
   * @param _navigate - The navigation function (unused, kept for API compatibility).
   * @returns Promise<User | null> - The user object or null if unavailable.
   */
  getUserFromToken: async (_navigate: (path: string) => void): Promise<User | null> => {
    return TokenUtils.getStoredUser();
  },

  /**
   * Gets the stored user from localStorage.
   * @returns User | null - The stored user or null.
   */
  getStoredUser: (): User | null => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Clears the stored user data.
   */
  clearUser: (): void => {
    localStorage.removeItem(USER_STORAGE_KEY);
  },

  /**
   * Subscribes to Firebase auth state changes.
   * @param callback - Function to call when auth state changes.
   * @returns Unsubscribe function.
   */
  onAuthStateChange: (callback: (isAuthenticated: boolean) => void): (() => void) => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      callback(firebaseUser !== null);
    });
  },
};

export default TokenUtils;
