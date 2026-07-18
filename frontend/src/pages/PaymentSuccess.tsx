import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Confetti from "react-confetti";
import UserLayout from "../components/UserLayout";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const sessionIdFromUrl = searchParams.get("session_id");
    setSessionId(sessionIdFromUrl);
  }, [searchParams]);

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    // Stop confetti after 5 seconds
    const confettiTimer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(confettiTimer);
    };
  }, []);

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  const handleViewBookings = () => {
    navigate("/dashboard/my-bookings");
  };

  return (
    <UserLayout>
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}
      <div className="payment-page">
        <div className="payment-card success-card">
          <h1 className="payment-title">Επιτυχής Πληρωμή!</h1>

          <p className="payment-description">
            Η κράτησή σας έχει επιβεβαιωθεί και η πληρωμή επεξεργάστηκε επιτυχώς!
          </p>

          <div className="payment-details">
            <div className="detail-item">
              <span className="detail-text">
                Ένα email επιβεβαίωσης στάλθηκε στη διεύθυνση email σας
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-text">
                Μπορείτε να δείτε τις λεπτομέρειες της κράτησής σας στις "Οι Κρατήσεις μου"
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-text">
                Ετοιμαστείτε για το παιχνίδι σας! Τα λέμε στο γήπεδο!
              </span>
            </div>
          </div>

          {sessionId && (
            <div className="session-info">
              <small className="session-id">Session ID: {sessionId}</small>
            </div>
          )}

          <div className="payment-actions">
            <button className="btn btn-secondary" onClick={handleGoToDashboard}>
              Επιστροφή στην Αρχική
            </button>
            <button className="btn btn-primary" onClick={handleViewBookings}>
              Προβολη Κρατησεων
            </button>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default PaymentSuccess;
