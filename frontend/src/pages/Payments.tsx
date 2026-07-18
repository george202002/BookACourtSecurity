import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { getUserPayments } from "../services/PaymentService";
import type { Payment, PaginatedPaymentResponse } from "../dtos/Payment";

const Payments = () => {
  const navigate = useNavigate();
  const [paymentData, setPaymentData] =
    useState<PaginatedPaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserPayments(navigate, currentPage, pageSize);
      setPaymentData(data);
    } catch (err) {
      setError("Αποτυχία φόρτωσης ιστορικού πληρωμών. Παρακαλώ δοκιμάστε αργότερα.");
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  }, [navigate, currentPage]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: "EUR",
    }).format(amount / 100); // Assuming amount is in cents
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("el-GR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "status-completed";
      case "refunded":
        return "status-refunded";
      default:
        return "status-pending";
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Calculate total amount from current page payments
  const calculateTotalAmount = () => {
    if (!paymentData || paymentData.empty) return 0;
    return paymentData.content.reduce(
      (total, payment) => total + payment.amount,
      0,
    );
  };

  return (
    <UserLayout>
      <div className="page-header">
        <h1 className="page-title">Πληρωμές</h1>
        <p className="page-subtitle">
          Δείτε το ιστορικό πληρωμών και τις λεπτομέρειες συναλλαγών
        </p>
      </div>

      {error && (
        <div className="dashboard-card">
          <div className="card-content">
            <div className="error-message">
              <h4>Σφάλμα</h4>
              <p>{error}</p>
              <button onClick={fetchPayments} className="btn btn-primary">
                Δοκιμάστε Ξανά
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Ιστορικό Πληρωμών</h3>
            <p className="card-subtitle">Παρακολουθήστε τις πληρωμές σας</p>
          </div>
          {paymentData && !paymentData.empty && (
            <div className="payment-summary">
              <span className="total-amount">
                Συνολικά Έξοδα: {formatCurrency(calculateTotalAmount())}
              </span>
              <span className="total-count">
                {paymentData.totalElements} συναλλαγές
              </span>
            </div>
          )}
        </div>

        <div className="card-content">
          {loading ? (
            <LoadingSkeleton variant="table" count={5} />
          ) : paymentData && !paymentData.empty ? (
            <>
              <div className="payments-table">
                <div className="table-header">
                  <div className="table-row">
                    <div className="table-cell">Ημερομηνία</div>
                    <div className="table-cell">Γήπεδο</div>
                    <div className="table-cell">Ποσό</div>
                    <div className="table-cell">Κατάσταση</div>
                    <div className="table-cell">ID Κράτησης</div>
                  </div>
                </div>
                <div className="table-body">
                  {paymentData.content.map((payment: Payment) => (
                    <div key={payment.id} className="table-row">
                      <div className="table-cell">
                        {formatDate(payment.createdAt)}
                      </div>
                      <div className="table-cell">
                        <div className="payment-description">
                          <strong>
                            {payment.courtName || "Κράτηση Γηπέδου"}
                          </strong>
                        </div>
                      </div>
                      <div className="table-cell">
                        <span className="amount">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                      <div className="table-cell">
                        <span
                          className={`status-badge ${getStatusBadgeClass(payment.status)}`}
                        >
                          {payment.status}
                        </span>
                      </div>
                      <div className="table-cell">#{payment.bookingId}</div>
                    </div>
                  ))}
                </div>
              </div>

              {paymentData.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={paymentData.first}
                    className="pagination-btn"
                  >
                    Προηγούμενο
                  </button>
                  <span className="pagination-info">
                    Σελίδα {paymentData.number + 1} από {paymentData.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={paymentData.last}
                    className="pagination-btn"
                  >
                    Επόμενο
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <h4 className="empty-title">Δεν υπάρχει ιστορικό πληρωμών ακόμα</h4>
              <p className="empty-description">
                Οι συναλλαγές πληρωμής σας θα εμφανιστούν εδώ όταν ξεκινήσετε να κάνετε κρατήσεις γηπέδων.
              </p>
              <button
                onClick={() => navigate("/dashboard/find-courts")}
                className="btn btn-primary"
              >
                Εύρεση Γηπέδων για Κράτηση
              </button>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
};

export default Payments;
