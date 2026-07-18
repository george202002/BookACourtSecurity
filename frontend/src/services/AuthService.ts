import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  type User,
  type Unsubscribe,
} from "firebase/auth";
import { auth } from "../config/firebase";
import type { AuthRequestDto, AuthResponseDto, RegisterData } from "../interfaces/auth";
import { type User as AppUser, createUserFromResponse } from "../dtos/User";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const USER_STORAGE_KEY = "user";

class AuthService {
  // Backend API calls
  private async callBackendRegister(request: AuthRequestDto): Promise<AuthResponseDto> {
    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || "Σφάλμα καταχώρησης";

      if (response.status === 401 && errorMessage.includes("Email")) {
        throw new Error("Email not verified");
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  private async callBackendLogin(request: AuthRequestDto): Promise<AuthResponseDto> {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || "Σφάλμα σύνδεσης";

      if (response.status === 401 && errorMessage.includes("Email")) {
        throw new Error("Email not verified");
      }

      // User exists in Firebase but not in the backend DB - callers use this
      // message to fall back to the registration/profile-completion flow
      if (response.status === 404) {
        throw new Error("Ο χρήστης δεν βρέθηκε");
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Store user data in localStorage
  private storeUser(user: AppUser): void {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  private clearStoredUser(): void {
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  // Email/Password Registration
  async register(data: RegisterData): Promise<AppUser> {
    try {
      const persistence = data.rememberMe ?? true
        ? browserLocalPersistence
        : browserSessionPersistence;
      await setPersistence(auth, persistence);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      await updateProfile(userCredential.user, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      // Send email verification
      await sendEmailVerification(userCredential.user);

      const firebaseToken = await userCredential.user.getIdToken();
      let authResponse: AuthResponseDto;
      try {
        authResponse = await this.callBackendRegister({
          firebaseToken,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
        });
      } catch (backendError) {
        // Keep Firebase and the DB in sync: remove the just-created Firebase
        // account (the backend also deletes it server-side, so ignore failures)
        // and drop the now-dead local session before surfacing the error
        await userCredential.user.delete().catch(() => {});
        await signOut(auth).catch(() => {});
        throw backendError;
      }
      const appUser = createUserFromResponse(authResponse);

      this.storeUser(appUser);
      return appUser;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Email/Password Login
  async login(email: string, password: string, rememberMe: boolean = true): Promise<AppUser> {
    try {
      const persistence = rememberMe
        ? browserLocalPersistence
        : browserSessionPersistence;
      await setPersistence(auth, persistence);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseToken = await userCredential.user.getIdToken();
      const authResponse = await this.callBackendLogin({ firebaseToken });
      const appUser = createUserFromResponse(authResponse);

      this.storeUser(appUser);
      return appUser;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Google Sign In - returns user info, caller decides whether to register or login
  async loginWithGoogle(rememberMe: boolean = true): Promise<{
    user: User;
    isNewUser: boolean;
    firebaseToken: string;
  }> {
    try {
      const persistence = rememberMe
        ? browserLocalPersistence
        : browserSessionPersistence;
      await setPersistence(auth, persistence);

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseToken = await result.user.getIdToken();

      // Check if user is new by comparing creation and last sign in times
      const isNewUser =
        result.user.metadata?.creationTime === result.user.metadata?.lastSignInTime;

      return {
        user: result.user,
        isNewUser,
        firebaseToken,
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Register social user with backend
  async registerSocial(
    firebaseToken: string,
    profileData?: { firstName: string; lastName: string; phoneNumber: string }
  ): Promise<AppUser> {
    try {
      if (profileData && auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: `${profileData.firstName} ${profileData.lastName}`,
        });
      }

      const authResponse = await this.callBackendRegister({
        firebaseToken,
        firstName: profileData?.firstName,
        lastName: profileData?.lastName,
        phoneNumber: profileData?.phoneNumber,
      });
      const appUser = createUserFromResponse(authResponse);
      this.storeUser(appUser);
      return appUser;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Login social user with backend
  async loginSocial(firebaseToken: string): Promise<AppUser> {
    try {
      const authResponse = await this.callBackendLogin({ firebaseToken });
      const appUser = createUserFromResponse(authResponse);
      this.storeUser(appUser);
      return appUser;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      this.clearStoredUser();
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Send password reset email
  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Change password (requires re-authentication)
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error("No user currently logged in");
      }

      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Get current Firebase user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Get stored app user from localStorage
  getStoredUser(): AppUser | null {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  }

  // Check if user has email/password provider (can change password)
  hasPasswordProvider(): boolean {
    const user = auth.currentUser;
    if (!user) return false;
    return user.providerData?.some(provider => provider.providerId === "password") ?? false;
  }

  // Check if user has Google provider
  hasGoogleProvider(): boolean {
    const user = auth.currentUser;
    if (!user) return false;
    return user.providerData?.some(provider => provider.providerId === "google.com") ?? false;
  }

  // Subscribe to auth state changes
  subscribeToAuthStateChanges(callback: (user: User | null) => void): Unsubscribe {
    return onAuthStateChanged(auth, callback);
  }

  // Get token info including expiration time
  async getTokenInfo() {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    try {
      const tokenResult = await user.getIdTokenResult();
      return {
        token: tokenResult.token,
        expirationTime: new Date(tokenResult.expirationTime),
        issuedAtTime: new Date(tokenResult.issuedAtTime),
        signInProvider: tokenResult.signInProvider,
      };
    } catch (error) {
      console.error("Failed to get token info:", error);
      return null;
    }
  }

  // Get fresh ID token
  async getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }
    try {
      return await user.getIdToken();
    } catch {
      return null;
    }
  }

  // Refresh user data from backend
  async refreshUserData(): Promise<AppUser | null> {
    const idToken = await this.getIdToken();
    if (!idToken) {
      this.clearStoredUser();
      return null;
    }

    try {
      const authResponse = await this.callBackendLogin({ firebaseToken: idToken });
      const appUser = createUserFromResponse(authResponse);
      this.storeUser(appUser);
      return appUser;
    } catch {
      this.clearStoredUser();
      return null;
    }
  }

  // Centralized error handling
  private handleAuthError(error: unknown): Error {
    if (error instanceof Error) {
      const errorCode = (error as { code?: string }).code;
      switch (errorCode) {
        case "auth/email-already-in-use":
          return new Error("Αυτό το email χρησιμοποιείται ήδη");
        case "auth/weak-password":
          return new Error("Ο κωδικός πρόσβασης είναι πολύ αδύναμος");
        case "auth/invalid-email":
          return new Error("Άκυρη διεύθυνση email");
        case "auth/invalid-credential":
          return new Error("Λανθασμένο email ή κωδικός πρόσβασης");
        case "auth/user-not-found":
          return new Error("Ο χρήστης δεν βρέθηκε");
        case "auth/wrong-password":
          return new Error("Λάθος κωδικός πρόσβασης");
        case "auth/too-many-requests":
          return new Error("Πολλές προσπάθειες σύνδεσης, παρακαλώ δοκιμάστε αργότερα");
        case "auth/popup-blocked":
          return new Error("Το παράθυρο σύνδεσης αποκλείστηκε. Παρακαλώ ενεργοποιήστε τα αναδυόμενα παράθυρα.");
        case "auth/popup-closed-by-user":
          return new Error("Το αναδυόμενο παράθυρο σύνδεσης έκλεισε");
        case "auth/cancelled-popup-request":
          return new Error("Η αίτηση σύνδεσης ακυρώθηκε");
        case "auth/requires-recent-login":
          return new Error("Απαιτείται επανασύνδεση για αυτή την ενέργεια");
        default:
          // If error has a message, use it
          if (error.message) {
            return error;
          }
          return new Error("Σφάλμα κατά την αυθεντικοποίηση");
      }
    }
    return new Error("Παρουσιάστηκε σφάλμα");
  }
}

export const authService = new AuthService();
export default authService;
