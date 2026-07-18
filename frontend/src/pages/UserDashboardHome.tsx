import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import { getUserBookingStats } from "../services/BookingsService";
import LoadingSkeleton from "../components/LoadingSkeleton";
import type { BookingRequest } from "../dtos/Booking";

const UserDashboardHome = () => {
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    thisMonthSpent: 0,
    completedBookings: 0,
  });
  const [upcomingBookings, setUpcomingBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch user bookings with larger size to get all bookings for stats
        const bookingStats = await getUserBookingStats(navigate);

        // Calculate upcoming bookings (today and future)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = bookingStats.upcomingBookings;
        const completed = bookingStats.completedBookings;
        const monthlySpent = bookingStats.thisMonthSpent;

        // Sort upcoming bookings by date
        const sortedUpcoming = upcoming.sort((a, b) =>
          new Date(a.booking.dateTime).getTime() -
          new Date(b.booking.dateTime).getTime()
        );

        setUpcomingBookings(sortedUpcoming);

        setDashboardStats({
          totalBookings: bookingStats.totalBookings,
          upcomingBookings: bookingStats.upcomingBookingsCount,
          thisMonthSpent: monthlySpent,
          completedBookings: completed,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

    const quickActions = [
    {
      title: "Εύρεση Γηπέδων",
      description: "Περιηγηθείτε σε διαθέσιμα γήπεδα",
      action: () => navigate("/dashboard/find-courts"),
      color: "primary",
    },
    {
      title: "Εύρεση Κρατήσεων",
      description: "Περιηγηθείτε σε διαθέσιμες κρατήσεις",
      action: () => navigate("/dashboard/find-bookings"),
      color: "primary",
    },
    {
      title: "Οι Κρατήσεις μου",
      description: "Προβολή και διαχείριση των κρατήσεων σας",
      action: () => navigate("/dashboard/my-bookings"),
      color: "secondary",
    },
    {
      title: "Ιστορικό Πληρωμών",
      description: "Ελέγξτε το ιστορικό πληρωμών σας",
      action: () => navigate("/dashboard/payments"),
      color: "tertiary",
    },
  ];

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
        return <span className="status-badge available-pending">{status}</span>;
    }
  };

  const formatTime = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    return `${start.toLocaleTimeString('el-GR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })} - ${end.toLocaleTimeString('el-GR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })}`;
  };

  const calculateBookingPrice = (bookingRequest: BookingRequest): number => {
    if (bookingRequest.priceInCents) {
      return bookingRequest.priceInCents / 100;
    }
    return 0;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("el-GR", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <UserLayout>
      <div className="dashboard-home">
        {/* Welcome Header */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Καλώς Ηρθατε!</h1>
          </div>
        </div>

        {/* Statistics Grid */}
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
            <div className="stat-value">{loading ? '...' : dashboardStats.totalBookings}</div>
            <div className="stat-trend">
              <span className="trend-text">συνολικά</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--success)'}}>
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className="stat-header">Επομενα Παιχνιδια</div>
            <div className="stat-value">{loading ? '...' : dashboardStats.upcomingBookings}</div>
            <div className="stat-trend">
              <span className="trend-text">προγραμματισμένα</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--warning)'}}>
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div className="stat-header">Εξοδα</div>
            <div className="stat-value">€{loading ? '...' : dashboardStats.thisMonthSpent.toFixed(2)}</div>
            <div className="stat-trend">
              <span className="trend-text">τρέχων μήνας</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--success)'}}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div className="stat-header">Ολοκληρωμενα Παιχνιδια</div>
            <div className="stat-value">{loading ? '...' : dashboardStats.completedBookings}</div>
            <div className="stat-trend">
              <span className="trend-text">ολοκληρωμένα</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Quick Actions */}
          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Γρήγορες Ενέργειες</h3>
                <p className="card-subtitle">
                  Ξεκινήστε με αυτές τις συνήθεις ενέργειες
                </p>
              </div>
            </div>
            <div className="card-content">
              <div className="quick-actions-grid">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className={`quick-action-card ${action.color}`}
                    onClick={action.action}
                  >
                    <div className="action-content">
                      <h4 className="action-title">{action.title}</h4>
                      <p className="action-description">{action.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Bookings */}
          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Επόμενες Κρατήσεις</h3>
                <p className="card-subtitle">Τα επόμενα προγραμματισμένα παιχνίδιά σας</p>
              </div>
                            <div className="card-actions">
                <button
                  className="card-action"
                  onClick={() => navigate("/dashboard/my-bookings")}
                >
                  Προβολη Ολων
                </button>
              </div>
            </div>
                        <div className="card-content">
              {loading ? (
                <LoadingSkeleton variant="list" count={3} />
              ) : upcomingBookings.length > 0 ? (
                <div className="bookings-list">
                  {upcomingBookings.map((bookingRequest) => (
                    <div key={bookingRequest.booking.id} className="booking-item">
                      <div className="booking-info">
                        <div className="booking-court">
                          {bookingRequest.booking.court.name}
                        </div>
                        <div className="booking-details">
                          <span className="booking-date">
                            {formatDate(new Date(bookingRequest.booking.dateTime).toISOString().split('T')[0])}
                          </span>
                          <span className="booking-time">
                            {(() => {
                              const bookingDateTime = new Date(bookingRequest.booking.dateTime);
                              const startTime = bookingDateTime.toTimeString().substring(0, 5);
                              const endDateTime = new Date(bookingDateTime.getTime() + (bookingRequest.booking.court.slotDuration || 1.5) * 60 * 60 * 1000);
                              const endTime = endDateTime.toTimeString().substring(0, 5);
                              return formatTime(startTime, endTime);
                            })()}
                          </span>
                        </div>
                        <div className="booking-timestamps-small">
                          <div className="timestamp-small">
                            <span className="timestamp-label-tiny">Δημιουργήθηκε:</span>
                            <span className="timestamp-value-tiny">
                              {bookingRequest.booking.createdAt
                                ? new Date(bookingRequest.booking.createdAt).toLocaleDateString('el-GR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'N/A'
                              }
                            </span>
                          </div>
                          {bookingRequest.booking.updatedAt && (
                            <div className="timestamp-small">
                              <span className="timestamp-label-tiny">Ενημερώθηκε:</span>
                              <span className="timestamp-value-tiny">
                                {new Date(bookingRequest.booking.updatedAt).toLocaleDateString('el-GR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="booking-status">
                        {getStatusBadge(bookingRequest.booking.status)}
                        <div className="booking-price">
                          €{calculateBookingPrice(bookingRequest).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                  <h4 className="empty-title">Δεν υπάρχουν επόμενες κρατήσεις</h4>
                  <p className="empty-description">
                    Ετοιμοι να κάνετε την επόμενη κράτηση;
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate("/dashboard/find-courts")}
                  >
                    Κρατηση Γηπεδου
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        
      </div>
    </UserLayout>
  );
};

export default UserDashboardHome;
