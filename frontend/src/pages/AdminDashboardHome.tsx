import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { getAdminBookingStats } from "../services/BookingsService";
import LoadingSkeleton from "../components/LoadingSkeleton";
import type { BookingRequest } from "../dtos/Booking";
import { formatDateForDisplay } from "../utils/DateUtils";
import { GREEK_CITY_DISPLAY_NAMES, COURT_TYPES_GREEK, COURT_ENVIRONMENT_GREEK, } from "../enums/CourtEnums";

const AdminDashboardHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeCourts: 0,
    todaysRevenue: 0,
    openBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState<BookingRequest[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const bookingStats = await getAdminBookingStats(navigate);

      const totalBookings = bookingStats.totalBookings;
      const activeCourts = bookingStats.totalActiveCourts;
      const openBookings = bookingStats.openBookingsCount;
      const todaysRevenue = bookingStats.todaysRevenue;
      setRecentBookings(bookingStats.recentBookings);

      setStats({
        totalBookings,
        activeCourts,
        todaysRevenue,
        openBookings,
      });
      
    } catch (err) {
      setError("Αποτυχία φόρτωσης δεδομένων. Παρακαλώ δοκιμάστε ξανά.");
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FILLED":
        return <span className="status-badge status-filled">Γεματη</span>;
      case "PENDING":
        return <span className="status-badge status-pending">Σε Εκκρεμότητα</span>;
      case "OPEN":
        return <span className="status-badge status-open">Ανοιχτη</span>;
      case "CANCELLED":
        return <span className="status-badge status-cancelled">Ακυρωμενη</span>;
      case "COMPLETED":
        return <span className="status-badge status-completed">Ολοκληρωμενη</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("el-GR", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getCourtTypeInitials = (courtType: string) => {
    switch (courtType) {
      case "Padel":
        return "PD";
      case "Tennis":
        return "TN";
      case "Basketball":
        return "BB";
      case "Football":
        return "FB";
      default:
        return "CT";
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="page-header">
          <h1 className="page-title">Επισκόπηση Πίνακα Ελέγχου</h1>
          <p className="page-subtitle">
            Παρακολουθήστε την απόδοση των γηπέδων σας και διαχειριστείτε τις λειτουργίες
          </p>
        </div>
        <LoadingSkeleton variant="stats" count={4} />
        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <div className="skeleton skeleton-title" style={{ width: '200px', height: '24px' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '280px', height: '16px', marginTop: '8px' }}></div>
            </div>
          </div>
          <div className="card-content">
            <LoadingSkeleton variant="table" count={5} />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="page-header">
          <h1 className="page-title">Επισκόπηση Πίνακα Ελέγχου</h1>
          <p className="page-subtitle">
            Παρακολουθήστε την απόδοση των γηπέδων σας και διαχειριστείτε τις λειτουργίες
          </p>
        </div>
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button className="btn btn-primary" onClick={loadDashboardData}>
            Δοκιμάστε Ξανά
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title">Επισκόπηση Πίνακα Ελέγχου</h1>
        <p className="page-subtitle">
          Παρακολουθήστε την απόδοση των γηπέδων σας και διαχειριστείτε τις λειτουργίες
        </p>
      </div>

      {/* Real Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--primary-blue)'}}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div className="stat-header">Συνολο Κρατησεων</div>
          <div className="stat-value">
            {stats.totalBookings.toLocaleString()}
          </div>
          <div className="stat-description">Συνολικές κρατήσεις</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--success)'}}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          </div>
          <div className="stat-header">Ενεργα Γηπεδα</div>
          <div className="stat-value">{stats.activeCourts}</div>
          <div className="stat-description">Ενεργά</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--warning)'}}>
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="stat-header">Εσοδα Σημερα</div>
          <div className="stat-value">€{stats.todaysRevenue.toFixed(2)}</div>
          <div className="stat-description">Επιβεβαιωμένες κρατήσεις σήμερα</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--error)'}}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="stat-header">Ανοιχτες Κρατησεις</div>
          <div className="stat-value">{stats.openBookings}</div>
          <div className="stat-description">Αναμένουν περισσότερους παίκτες</div>
        </div>
      </div>

      {/* Real Recent Bookings */}
      <div className="dashboard-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Πρόσφατες Κρατήσεις</h2>
            <p className="card-subtitle">
              Οι τελευταίες κρατήσεις γηπέδων και η κατάστασή τους
            </p>
          </div>
          <div className="card-actions">
            <button
              className="card-action"
              onClick={() => navigate("/admin-dashboard/manage-bookings")}
            >
              Προβολη Ολων
            </button>
          </div>
        </div>
        <div className="card-content">
          {recentBookings.length > 0 ? (
            <table className="data-table">
              <thead className="table-header">
                <tr>
                  <th>Γηπεδο</th>
                  <th>Τοποθεσια</th>
                  <th>Ημερομηνια & Ωρα</th>
                  <th>Παικτης</th>
                  <th>Ποσο</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((bookingReq) => {
                  const court = bookingReq.booking.court;
                  const mainPlayer = bookingReq.players[0] || {
                    playerName: "Άγνωστος",
                    playerPhone: "",
                  };

                  return (
                    <tr key={bookingReq.booking.id} className="table-row">
                      <td className="table-cell">
                        <div className="cell-content">
                          <div className="cell-avatar">
                            {getCourtTypeInitials(court.courtType)}
                          </div>
                          <div>
                            <div style={{ fontWeight: "600" }}>
                              {court.name}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "var(--text-secondary)",
                              }}
                            >
                              {COURT_TYPES_GREEK[court.courtType]} • {COURT_ENVIRONMENT_GREEK[court.environment]}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div>
                          <div style={{ fontWeight: "500" }}>
                            {court.city ? GREEK_CITY_DISPLAY_NAMES[court.city] : "Άγνωστο"}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {court.address}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div>
                          <div style={{ fontWeight: "500" }}>
                            {formatDateForDisplay(
                  new Date(bookingReq.booking.dateTime).toISOString().split('T')[0],
                )}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {(() => {
                  const bookingDateTime = new Date(bookingReq.booking.dateTime);
                  const startTime = bookingDateTime.toTimeString().substring(0, 5);
                  const endDateTime = new Date(bookingDateTime.getTime() + (bookingReq.booking.court.slotDuration || 1.5) * 60 * 60 * 1000);
                  const endTime = endDateTime.toTimeString().substring(0, 5);
                  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
                })()}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div>
                          <div style={{ fontWeight: "500" }}>
                            {mainPlayer.playerName}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {bookingReq.players.length > 1
                              ? `+${bookingReq.players.length - 1} ακόμα παίκτ${bookingReq.players.length > 2 ? "ες" : "ης"}`
                              : mainPlayer.playerPhone}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell" style={{ fontWeight: "600" }}>
                        €{((bookingReq.priceInCents || 0) / 100).toFixed(2)}
                      </td>
                      <td className="table-cell">
                        {getStatusBadge(bookingReq.booking.status)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                  <path d="M8 14h.01"></path>
                  <path d="M12 14h.01"></path>
                  <path d="M16 14h.01"></path>
                  <path d="M8 18h.01"></path>
                  <path d="M12 18h.01"></path>
                </svg>
              </div>
              <h4 className="empty-title">Δεν Υπάρχουν Πρόσφατες Κρατήσεις</h4>
              <p className="empty-description">
                Δεν έχουν γίνει κρατήσεις ακόμα. Θα εμφανιστούν εδώ όταν δημιουργηθούν.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardHome;
