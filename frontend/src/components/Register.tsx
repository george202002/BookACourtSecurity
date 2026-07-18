import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/AuthService";
import "../styles/AuthDialogs.css";

type RegisterProps = {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
};

type Errors = {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  server?: string;
};

const Register: React.FC<RegisterProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    rememberMe: true,
  });

  const [errors, setErrors] = useState<Errors>({});
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);
  const [googleProfileData, setGoogleProfileData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });

    // Clear errors when user starts typing
    if (errors[name as keyof Errors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Errors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Το όνομα είναι υποχρεωτικό";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Το επίθετο είναι υποχρεωτικό";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Το επίθετο πρέπει να έχει τουλάχιστον 2 χαρακτήρες";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Το τηλέφωνο είναι υποχρεωτικό";
    } else if (!/^(\+30|0030)?6\d{9}$/.test(formData.phoneNumber.replace(/\s/g, ""))) {
      newErrors.phoneNumber = "Παρακαλώ εισάγετε έγκυρο ελληνικό κινητό (π.χ. 69xxxxxxxx)";
    }

    if (!formData.email) {
      newErrors.email = "Το email είναι υποχρεωτικό";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Παρακαλώ εισάγετε μια έγκυρη διεύθυνση email";
    }

    if (!formData.password) {
      newErrors.password = "Ο κωδικός πρόσβασης είναι υποχρεωτικός";
    } else if (formData.password.length < 6) {
      newErrors.password = "Ο κωδικός πρόσβασης πρέπει να έχει τουλάχιστον 6 χαρακτήρες";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Παρακαλώ επιβεβαιώστε τον κωδικό πρόσβασης";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Οι κωδικοί πρόσβασης δεν ταιριάζουν";
    }

    if (!agreeToTerms) {
      newErrors.terms = "Πρέπει να συμφωνήσετε με τους όρους χρήσης και την πολιτική απορρήτου";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await authService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.replace(/\s/g, ""),
        rememberMe: formData.rememberMe,
      });

      // Show success message for email verification
      setRegistrationSuccess(true);
    } catch (error) {
      console.error("Error registering:", error);

      if (error instanceof Error) {
        setErrors({ server: error.message });
      } else {
        setErrors({ server: "Προέκυψε ένα σφάλμα. Παρακαλώ δοκιμάστε ξανά." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateGoogleProfile = (): boolean => {
    const newErrors: Errors = {};

    if (!googleProfileData.firstName.trim()) {
      newErrors.firstName = "Το όνομα είναι υποχρεωτικό";
    } else if (googleProfileData.firstName.trim().length < 2) {
      newErrors.firstName = "Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες";
    }

    if (!googleProfileData.lastName.trim()) {
      newErrors.lastName = "Το επίθετο είναι υποχρεωτικό";
    } else if (googleProfileData.lastName.trim().length < 2) {
      newErrors.lastName = "Το επίθετο πρέπει να έχει τουλάχιστον 2 χαρακτήρες";
    }

    if (!googleProfileData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Το τηλέφωνο είναι υποχρεωτικό";
    } else if (!/^(\+30|0030)?6\d{9}$/.test(googleProfileData.phoneNumber.replace(/\s/g, ""))) {
      newErrors.phoneNumber = "Παρακαλώ εισάγετε έγκυρο ελληνικό κινητό (π.χ. 69xxxxxxxx)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleSignUp = async () => {
    if (!agreeToTerms) {
      setErrors({ terms: "Πρέπει να συμφωνήσετε με τους όρους χρήσης και την πολιτική απορρήτου" });
      return;
    }

    setIsGoogleLoading(true);
    setErrors({});

    try {
      const { user, isNewUser, firebaseToken } = await authService.loginWithGoogle(formData.rememberMe);

      if (isNewUser) {
        // New user - show profile completion form
        // Pre-fill name from Google account if available
        const displayName = user.displayName || "";
        const nameParts = displayName.split(" ");
        setGoogleProfileData({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          phoneNumber: "",
        });
        setPendingGoogleToken(firebaseToken);
        setIsGoogleLoading(false);
        return;
      }

      // Existing user - try login, if fails try register with profile form
      try {
        const appUser = await authService.loginSocial(firebaseToken);
        if (appUser.role === "ADMIN") {
          navigate("/admin-dashboard");
        } else {
          navigate("/dashboard");
        }
        handleClose();
      } catch (loginError) {
        if (loginError instanceof Error && loginError.message.includes("δεν βρέθηκε")) {
          // User exists in Firebase but not in backend - show profile form
          const displayName = user.displayName || "";
          const nameParts = displayName.split(" ");
          setGoogleProfileData({
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            phoneNumber: "",
          });
          setPendingGoogleToken(firebaseToken);
        } else {
          throw loginError;
        }
      }
    } catch (error) {
      console.error("Error with Google sign-up:", error);

      if (error instanceof Error) {
        if (error.message.includes("έκλεισε") || error.message.includes("ακυρώθηκε")) {
          // User closed the popup, no error to show
        } else {
          setErrors({ server: error.message });
        }
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateGoogleProfile() || !pendingGoogleToken) return;

    setIsLoading(true);
    setErrors({});

    try {
      const user = await authService.registerSocial(pendingGoogleToken, {
        firstName: googleProfileData.firstName.trim(),
        lastName: googleProfileData.lastName.trim(),
        phoneNumber: googleProfileData.phoneNumber.replace(/\s/g, ""),
      });

      if (user.role === "ADMIN") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }

      handleClose();
    } catch (error) {
      console.error("Error completing Google registration:", error);

      if (error instanceof Error) {
        setErrors({ server: error.message });
      } else {
        setErrors({ server: "Προέκυψε ένα σφάλμα. Παρακαλώ δοκιμάστε ξανά." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
      rememberMe: true,
    });
    setGoogleProfileData({
      firstName: "",
      lastName: "",
      phoneNumber: "",
    });
    setPendingGoogleToken(null);
    setErrors({});
    setAgreeToTerms(false);
    setIsLoading(false);
    setIsGoogleLoading(false);
    setRegistrationSuccess(false);
    onClose();
  };

  const handleSwitchToLogin = () => {
    setRegistrationSuccess(false);
    onSwitchToLogin();
  };

  if (!isOpen) return null;

  const isAnyLoading = isLoading || isGoogleLoading;

  // Show Google profile completion form
  if (pendingGoogleToken) {
    return (
      <div className="auth-overlay">
        <div className="auth-container">
          <div className="auth-header">
            <h2 className="auth-title">Ολοκληρώστε το Προφίλ σας</h2>
            <p className="auth-subtitle">
              Συμπληρώστε τα στοιχεία σας για να ολοκληρώσετε την εγγραφή
            </p>
            <button
              className="btn-close position-absolute top-0 end-0 mt-3 me-3"
              onClick={handleClose}
              type="button"
              aria-label="Close"
            />
          </div>

          <form onSubmit={handleGoogleProfileSubmit} className="auth-form">
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label text-uppercase fw-semibold small">Ονομα</label>
                <input
                  type="text"
                  className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                  value={googleProfileData.firstName}
                  onChange={(e) => {
                    setGoogleProfileData({ ...googleProfileData, firstName: e.target.value });
                    if (errors.firstName) setErrors({ ...errors, firstName: undefined });
                  }}
                  placeholder="Εισάγετε το όνομά σας"
                  disabled={isLoading}
                  autoComplete="given-name"
                  required
                />
                {errors.firstName && (
                  <div className="invalid-feedback">{errors.firstName}</div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label text-uppercase fw-semibold small">Επωνυμο</label>
                <input
                  type="text"
                  className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                  value={googleProfileData.lastName}
                  onChange={(e) => {
                    setGoogleProfileData({ ...googleProfileData, lastName: e.target.value });
                    if (errors.lastName) setErrors({ ...errors, lastName: undefined });
                  }}
                  placeholder="Εισάγετε το επώνυμό σας"
                  disabled={isLoading}
                  autoComplete="family-name"
                  required
                />
                {errors.lastName && (
                  <div className="invalid-feedback">{errors.lastName}</div>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-uppercase fw-semibold small">Τηλεφωνο</label>
              <input
                type="tel"
                className={`form-control ${errors.phoneNumber ? "is-invalid" : ""}`}
                value={googleProfileData.phoneNumber}
                onChange={(e) => {
                  setGoogleProfileData({ ...googleProfileData, phoneNumber: e.target.value });
                  if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: undefined });
                }}
                placeholder="π.χ. 6912345678"
                disabled={isLoading}
                autoComplete="tel"
                required
              />
              {errors.phoneNumber && (
                <div className="invalid-feedback">{errors.phoneNumber}</div>
              )}
            </div>

            {errors.server && (
              <div className="alert alert-danger py-2 mb-3" role="alert">
                {errors.server}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`btn btn-primary w-100 text-uppercase fw-semibold ${isLoading ? "btn-loading" : ""}`}
            >
              {isLoading ? "Ολοκλήρωση Εγγραφής..." : "Ολοκλήρωση Εγγραφής"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Show success message after registration
  if (registrationSuccess) {
    return (
      <div className="auth-overlay">
        <div className="auth-container">
          <div className="auth-header">
            <h2 className="auth-title">Επιβεβαιώστε το Email σας</h2>
            <p className="auth-subtitle">
              Σας στείλαμε ένα email επιβεβαίωσης
            </p>
            <button
              className="btn-close position-absolute top-0 end-0 mt-3 me-3"
              onClick={handleClose}
              type="button"
              aria-label="Close"
            />
          </div>

          <div className="auth-form">
            <div className="alert alert-success mb-3">
              <p className="mb-2">
                Ένα email επιβεβαίωσης έχει σταλεί στο <strong>{formData.email}</strong>.
              </p>
              <p className="mb-2">
                Παρακαλώ ελέγξτε τα εισερχόμενά σας και κάντε κλικ στον σύνδεσμο επιβεβαίωσης για να ενεργοποιήσετε τον λογαριασμό σας.
              </p>
              <p className="text-muted small mb-0">
                Δεν βλέπετε το email; Ελέγξτε τον φάκελο spam.
              </p>
            </div>

            <div className="text-center pt-3 border-top d-flex align-items-center justify-content-center gap-2">
              <span className="text-secondary">Έχετε επιβεβαιώσει το email σας;</span>
              <button
                type="button"
                onClick={handleSwitchToLogin}
                className="btn btn-link text-primary fw-semibold text-decoration-none p-0"
              >
                Σύνδεση
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-overlay">
      <div className="auth-container">
        <div className="auth-header">
          <h2 className="auth-title">Δημιουργήστε τον Λογαριασμό σας</h2>
          <p className="auth-subtitle">
            Συμμετέχετε σε χιλιάδες άλλους παίκτες
          </p>
          <button
            className="btn-close position-absolute top-0 end-0 mt-3 me-3"
            onClick={handleClose}
            type="button"
            aria-label="Close"
          />
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Google Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isAnyLoading}
            className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isGoogleLoading ? "Εγγραφή..." : "Συνέχεια με Google"}
          </button>

          <div className="auth-divider">
            <span>ή</span>
          </div>

          {/* Name Fields */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label text-uppercase fw-semibold small">Ονομα</label>
              <input
                type="text"
                name="firstName"
                className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Εισάγετε το όνομά σας"
                disabled={isAnyLoading}
                autoComplete="given-name"
                required
              />
              {errors.firstName && (
                <div className="invalid-feedback">{errors.firstName}</div>
              )}
            </div>

            <div className="col-md-6">
              <label className="form-label text-uppercase fw-semibold small">Επωνυμο</label>
              <input
                type="text"
                name="lastName"
                className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Εισάγετε το επώνυμό σας"
                disabled={isAnyLoading}
                autoComplete="family-name"
                required
              />
              {errors.lastName && (
                <div className="invalid-feedback">{errors.lastName}</div>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="mb-3">
            <label className="form-label text-uppercase fw-semibold small">Τηλεφωνο</label>
            <input
              type="tel"
              name="phoneNumber"
              className={`form-control ${errors.phoneNumber ? "is-invalid" : ""}`}
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="π.χ. 6912345678"
              disabled={isAnyLoading}
              autoComplete="tel"
              required
            />
            {errors.phoneNumber && (
              <div className="invalid-feedback">{errors.phoneNumber}</div>
            )}
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label text-uppercase fw-semibold small">Διευθυνση Email</label>
            <input
              type="email"
              name="email"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              value={formData.email}
              onChange={handleChange}
              placeholder="Εισάγετε τη διεύθυνση email σας"
              disabled={isAnyLoading}
              autoComplete="email"
              required
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email}</div>
            )}
          </div>

          {/* Password Fields */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label text-uppercase fw-semibold small">Κωδικος Προσβασης</label>
              <input
                type="password"
                name="password"
                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                value={formData.password}
                onChange={handleChange}
                placeholder="Κωδικός πρόσβασης"
                disabled={isAnyLoading}
                autoComplete="new-password"
                required
              />
              {errors.password && (
                <div className="invalid-feedback">{errors.password}</div>
              )}
            </div>

            <div className="col-md-6">
              <label className="form-label text-uppercase fw-semibold small">Επιβεβαιωση Κωδικου</label>
              <input
                type="password"
                name="confirmPassword"
                className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Επιβεβαιώστε τον κωδικό σας"
                disabled={isAnyLoading}
                autoComplete="new-password"
                required
              />
              {errors.confirmPassword && (
                <div className="invalid-feedback">{errors.confirmPassword}</div>
              )}
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="form-check mb-3">
            <input
              type="checkbox"
              className={`form-check-input ${errors.terms ? "is-invalid" : ""}`}
              id="agreeToTerms"
              checked={agreeToTerms}
              onChange={(e) => {
                setAgreeToTerms(e.target.checked);
                if (errors.terms) {
                  setErrors({ ...errors, terms: undefined });
                }
              }}
              disabled={isAnyLoading}
            />
            <label className="form-check-label text-secondary" htmlFor="agreeToTerms">
              Συμφωνώ με τους{" "}
              <a href="#" className="text-primary text-decoration-none fw-semibold">
                Όρους Χρήσης
              </a>{" "}
              και την{" "}
              <a href="#" className="text-primary text-decoration-none fw-semibold">
                Πολιτική Απορρήτου
              </a>
            </label>
            {errors.terms && (
              <div className="invalid-feedback d-block">{errors.terms}</div>
            )}
          </div>

          {/* Server Error */}
          {errors.server && (
            <div className="alert alert-danger py-2 mb-3" role="alert">
              {errors.server}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isAnyLoading}
            className={`btn btn-primary w-100 text-uppercase fw-semibold mb-3 ${isLoading ? "btn-loading" : ""}`}
          >
            {isLoading ? "Δημιουργία Λογαριασμού..." : "Δημιουργία Λογαριασμού"}
          </button>

          {/* Switch to Login */}
          <div className="text-center pt-3 border-top d-flex align-items-center justify-content-center gap-2">
            <span className="text-secondary">Έχετε ήδη λογαριασμό;</span>
            <button
              type="button"
              onClick={handleSwitchToLogin}
              className="btn btn-link text-primary fw-semibold text-decoration-none p-0"
              disabled={isAnyLoading}
            >
              Σύνδεση
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
