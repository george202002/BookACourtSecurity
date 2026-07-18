import React, { useState } from "react";
import authService from "../services/AuthService";
import "../styles/AuthDialogs.css";

type ForgotPasswordProps = {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
};

type Errors = {
  email?: string;
  server?: string;
};

const ForgotPassword: React.FC<ForgotPasswordProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
}) => {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors({ ...errors, email: undefined });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Errors = {};

    if (!email) {
      newErrors.email = "Το email είναι υποχρεωτικό";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Παρακαλώ εισάγετε μια έγκυρη διεύθυνση email";
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
      await authService.sendPasswordReset(email);
      setIsSuccess(true);
    } catch (error) {
      console.error("Forgot password error:", error);

      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes("auth/user-not-found")) {
          // For security, we show success even if user doesn't exist
          setIsSuccess(true);
        } else if (errorMessage.includes("auth/invalid-email")) {
          setErrors({ email: "Μη έγκυρη διεύθυνση email" });
        } else if (errorMessage.includes("auth/too-many-requests")) {
          setErrors({ server: "Πολλές προσπάθειες. Δοκιμάστε αργότερα." });
        } else {
          setErrors({
            server: "Απέτυχε η αποστολή email επαναφοράς. Παρακαλώ δοκιμάστε ξανά.",
          });
        }
      } else {
        setErrors({
          server: "Σφάλμα δικτύου. Παρακαλώ ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setErrors({});
    setIsLoading(false);
    setIsSuccess(false);
    onClose();
  };

  const handleSwitchToLogin = () => {
    setEmail("");
    setErrors({});
    setIsLoading(false);
    setIsSuccess(false);
    onSwitchToLogin();
  };

  if (!isOpen) return null;

  return (
    <div className="auth-overlay">
      <div className="auth-container">
        <div className="auth-header">
          <h2 className="auth-title">
            {isSuccess ? "Ελέγξτε το Email σας" : "Ξεχάσατε τον Κωδικό"}
          </h2>
          <p className="auth-subtitle">
            {isSuccess
              ? "Στείλαμε οδηγίες επαναφοράς κωδικού στη διεύθυνση email σας."
              : "Εισάγετε τη διεύθυνση email σας και θα σας στείλουμε ένα σύνδεσμο για επαναφορά του κωδικού σας."}
          </p>
          <button
            className="btn-close position-absolute top-0 end-0 mt-3 me-3"
            onClick={handleClose}
            type="button"
            aria-label="Close"
            disabled={isLoading}
          />
        </div>

        {isSuccess ? (
          <div className="auth-form">
            <div className="alert alert-success mb-3">
              <p className="mb-2">
                Εάν υπάρχει λογαριασμός με email <strong>{email}</strong>, θα
                λάβετε σύνδεσμο επαναφοράς κωδικού σύντομα.
              </p>
              <p className="mb-0 text-muted small">
                Δεν βλέπετε το email; Ελέγξτε τον φάκελο spam ή δοκιμάστε ξανά.
              </p>
            </div>

            <div className="text-center pt-3 border-top d-flex align-items-center justify-content-center gap-2">
              <span className="text-secondary">Θυμάστε τον κωδικό σας;</span>
              <button
                type="button"
                onClick={handleSwitchToLogin}
                className="btn btn-link text-primary fw-semibold text-decoration-none p-0"
                disabled={isLoading}
              >
                Επιστροφή στη Σύνδεση
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {errors.server && (
              <div className="alert alert-danger py-2 mb-3" role="alert">
                {errors.server}
              </div>
            )}

            <div className="mb-3">
              <label className="form-label text-uppercase fw-semibold small">Διεύθυνση Email</label>
              <input
                type="email"
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                value={email}
                onChange={handleEmailChange}
                placeholder="Εισάγετε τη διεύθυνση email σας"
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email}</div>
              )}
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-100 text-uppercase fw-semibold mb-3 ${isLoading ? "btn-loading" : ""}`}
              disabled={isLoading}
            >
              Αποστολή Συνδέσμου Επαναφοράς
            </button>

            <div className="text-center pt-3 border-top d-flex align-items-center justify-content-center gap-2">
              <span className="text-secondary">Θυμάστε τον κωδικό σας;</span>
              <button
                type="button"
                onClick={handleSwitchToLogin}
                className="btn btn-link text-primary fw-semibold text-decoration-none p-0"
                disabled={isLoading}
              >
                Επιστροφή στη Σύνδεση
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
