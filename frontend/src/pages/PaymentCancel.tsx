import { useNavigate } from "react-router-dom";
import UserLayout from "../components/UserLayout";

const PaymentCancel = () => {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  const handleTryAgain = () => {
    navigate("/dashboard/find-courts");
  };

  return (
    <UserLayout>
      <div className="payment-page">
        <div className="payment-card cancel-card">
          <h1 className="payment-title">Πληρωμή Ακυρώθηκε</h1>

          <p className="payment-description">
            Η πληρωμή σας ακυρώθηκε και δεν δημιουργήθηκε κράτηση.
          </p>

          <div className="payment-details">
            <div className="detail-item">
              <span className="detail-text">
                Δεν έγινε καμία χρέωση στον τρόπο πληρωμής σας
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-text">
                Το γήπεδο είναι ακόμα διαθέσιμο για κράτηση
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-text">
                Μπορείτε να δοκιμάσετε να κάνετε κράτηση αργότερα όταν είστε έτοιμοι
              </span>
            </div>
          </div>

          <div className="payment-actions">
            <button className="btn btn-secondary" onClick={handleGoToDashboard}>
              Επιστροφή στην Αρχική
            </button>
            <button className="btn btn-primary" onClick={handleTryAgain}>
              Νεα Προσπαθεια Κρατησης
            </button>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default PaymentCancel;
