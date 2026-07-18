import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import { getUserBookings, cancelBooking } from "../services/BookingsService";
import TokenUtils from "../utils/TokenUtils";
import ConfirmationModal from "../components/ConfirmationModal";
import MessageModal from "../components/MessageModal";
import LoadingSkeleton from "../components/LoadingSkeleton";
import type { BookingRequest } from "../dtos/Booking";
import {
  COURT_TYPES_GREEK,
  COURT_ENVIRONMENT_GREEK,
  getCitiesForDropdown,
  type GreekCity,
  type CourtType,
  type CourtEnvironment,
} from "../enums/CourtEnums";
import type { FilterCriteria } from "../dtos/FilterCriteria";
import { formatDateFromForZonedDateTime, formatDateToForZonedDateTime, validateDateRange } from "../utils/DateUtils";

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState<string | undefined>();
  const [selectedCity, setSelectedCity] = useState<GreekCity | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<CourtType | undefined>(undefined);
  const [selectedEnvironment, setSelectedEnvironment] = useState<CourtEnvironment | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<BookingRequest["booking"]["status"] | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

    // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(4);

  // Cancellation state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<BookingRequest | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Success message modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Load bookings on mount
  useEffect(() => {
    loadUserBookings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load bookings when pagination changes
  useEffect(() => {
    loadUserBookings();
  }, [currentPage, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserBookings = async () => {
    try {
      // Validate date range before sending to backend
      if (!validateDateRange(dateFrom, dateTo)) {
        setError("Η Ημερομηνία Από δεν μπορεί να είναι μετά την Ημερομηνία Έως");
        return;
      }

      setLoading(true);
      setError(null);

      const filters: FilterCriteria = {
        page: currentPage,
        size: pageSize,
        admin: false,
      };

      if (searchTerm && searchTerm.trim()) {
        filters.searchTerm = searchTerm.trim();
      }
      if (selectedCity) {
        filters.city = selectedCity;
      }
      if (selectedType) {
        filters.courtType = selectedType;
      }
      if (selectedEnvironment) {
        filters.environment = selectedEnvironment;
      }
      if (selectedStatus) {
        filters.status = selectedStatus;
      }
      // Format dates as ISO 8601 with time for Java ZonedDateTime parsing
      if (dateFrom) {
        filters.dateFrom = formatDateFromForZonedDateTime(dateFrom);
      }
      if (dateTo) {
        filters.dateTo = formatDateToForZonedDateTime(dateTo);
      }

      const response = await getUserBookings(navigate, filters);
      setBookings(response.content);
      setPagination({
        currentPage: response.number,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
        pageSize: response.size,
      });
    } catch (err) {
      setError("Αποτυχία φόρτωσης των κρατήσεων σας. Παρακαλώ δοκιμάστε ξανά.");
      console.error("Error loading user bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const handleSearch = () => {
    setCurrentPage(0);
    loadUserBookings();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCity(undefined);
    setSelectedType(undefined);
    setSelectedEnvironment(undefined);
    setSelectedStatus(undefined);
    setDateFrom("");
    setDateTo("");
    setCurrentPage(0);
    loadUserBookings();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("el-GR", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM format
  };

    const isUpcoming = (booking: BookingRequest) => {
    const bookingDateTime = new Date(booking.booking.dateTime);
    return bookingDateTime > new Date();
  };

  const canCancelBooking = (booking: BookingRequest) => {
    // Only allow cancellation for FILLED or OPEN bookings
    if (booking.booking.status !== "FILLED" && booking.booking.status !== "OPEN") {
      return false;
    }

    const bookingDateTime = new Date(booking.booking.dateTime);
    const now = new Date();
    const oneHourInMs = 60 * 60 * 1000;

    // Can cancel if booking is more than 1 hour away
    return bookingDateTime.getTime() - now.getTime() > oneHourInMs;
  };

  const handleCancelClick = (booking: BookingRequest) => {
    setBookingToCancel(booking);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!bookingToCancel) return;

    try {
      setCancelling(true);
      const user = await TokenUtils.getUserFromToken(navigate);
      if (!user) {
        throw new Error("Δεν βρέθηκε ο χρήστης");
      }

      await cancelBooking(bookingToCancel.booking.id, navigate);

      // Refresh bookings
      await loadUserBookings();

      // Show success message
      const bookingDateTime = new Date(bookingToCancel.booking.dateTime);
      const startTime = bookingDateTime.toTimeString().substring(0, 5);
      const dateStr = bookingDateTime.toISOString().split('T')[0];
      setSuccessMessage(
        `Η κράτηση σας για το ${bookingToCancel.booking.court.name} στις ${formatDate(dateStr)} στις ${formatTime(startTime)} ακυρώθηκε επιτυχώς. Τα χρήματα σας, θα εμφανιστούν στον λογαριασμό σας εντός λίγων ημερών.`
      );

      setShowCancelModal(false);
      setBookingToCancel(null);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      setError("Αποτυχία ακύρωσης κράτησης. Παρακαλώ δοκιμάστε ξανά.");
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
    setBookingToCancel(null);
  };

  const upcomingBookings = bookings.filter(isUpcoming);

  return (
    <UserLayout>
      <div className="page-header">
        <h1 className="page-title">Οι Κρατήσεις μου</h1>
        <p className="page-subtitle">
          Διαχειριστείτε και δείτε όλες τις κρατήσεις σας
        </p>
      </div>

      {loading && (
        <>
          <LoadingSkeleton variant="filters" />
          <LoadingSkeleton variant="stats" count={2} />
          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <div className="skeleton skeleton-title" style={{ width: '200px', height: '24px' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '150px', height: '16px', marginTop: '8px' }}></div>
              </div>
            </div>
            <div className="card-content">
              <LoadingSkeleton variant="bookings" count={4} />
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="dashboard-card">
          <div className="card-content">
            <p className="error-message">{error}</p>
            <button className="btn btn-primary" onClick={loadUserBookings}>
              Δοκιμάστε Ξανά
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Filters Section */}
          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Φιλτράρισμα Κρατήσεων</h3>
                <p className="card-subtitle">Βρείτε γρήγορα συγκεκριμένες κρατήσεις</p>
              </div>
              <div className="filter-actions">
                <button className="btn btn-secondary" onClick={clearFilters}>
                  Καθαρισμος Ολων
                </button>
                <button className="btn btn-primary" onClick={handleSearch}>
                  Αναζητηση
                </button>
              </div>
            </div>
            <div className="card-content">
              <div className="filters-grid">
                {/* Search */}
                <div className="filter-group">
                  <label className="filter-label">Αναζητηση</label>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Αναζήτηση ονόματος..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>

                {/* City */}
                <div className="filter-group">
                  <label className="filter-label">Πολη</label>
                  <select
                    className="filter-select"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value as GreekCity)}
                  >
                    <option value="">Όλες οι Πόλεις</option>
                    {getCitiesForDropdown().map((city) => (
                      <option key={city.key} value={city.key}>
                        {city.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="filter-group">
                  <label className="filter-label">Κατασταση</label>
                  <select
                    className="filter-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as BookingRequest["booking"]["status"])}
                  >
                    <option value="">Όλες οι Καταστάσεις</option>
                    <option value="FILLED">Γεμάτο</option>
                    <option value="OPEN">Ανοιχτό</option>
                    <option value="CANCELLED">Ακυρωμένο</option>
                    <option value="COMPLETED">Ολοκληρωμένο</option>
                  </select>
                </div>

                {/* Court Type */}
                <div className="filter-group">
                  <label className="filter-label">Αθλημα</label>
                  <select
                    className="filter-select"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as CourtType)}
                  >
                    <option value="">Όλα τα Αθλήματα</option>
                    {Object.entries(COURT_TYPES_GREEK).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Environment */}
                <div className="filter-group">
                  <label className="filter-label">Περιβαλλον</label>
                  <select
                    className="filter-select"
                    value={selectedEnvironment}
                    onChange={(e) => setSelectedEnvironment(e.target.value as CourtEnvironment)}
                  >
                    <option value="">Εσωτερικό και Εξωτερικό</option>
                    {Object.entries(COURT_ENVIRONMENT_GREEK).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date From */}
                <div className="filter-group">
                  <label className="filter-label">Ημερομηνια Απο</label>
                  <input
                    type="date"
                    className={`filter-input ${
                      dateFrom && dateTo && !validateDateRange(dateFrom, dateTo)
                        ? "error"
                        : ""
                    }`}
                    value={dateFrom}
                    onChange={(e) => {
                      const newDateFrom = e.target.value;
                      setDateFrom(newDateFrom);
                      // If dateTo is set and is earlier than new dateFrom, clear dateTo
                      if (dateTo && newDateFrom && newDateFrom > dateTo) {
                        setDateTo("");
                      }
                    }}
                  />
                </div>

                {/* Date To */}
                <div className="filter-group">
                  <label className="filter-label">Ημερομηνια Εως</label>
                  <input
                    type="date"
                    className={`filter-input ${
                      dateFrom && dateTo && !validateDateRange(dateFrom, dateTo)
                        ? "error"
                        : ""
                    }`}
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                  {dateFrom && dateTo && !validateDateRange(dateFrom, dateTo) && (
                    <small className="error-message">Η Ημερομηνία Έως πρέπει να είναι ίδια ή μετά την Ημερομηνία Από</small>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div
            className="stats-grid"
            style={{
              gridTemplateColumns: "repeat(2, 1fr)",
              marginBottom: "24px",
            }}
          >
            <div className="stat-card">
              <div className="stat-header">Συνολο Κρατησεων</div>
              <div className="stat-value">{pagination.totalElements}</div>
              <div className="stat-trend">
                <span className="trend-text">συνολικά</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-header">Επομενα Παιχνιδια</div>
              <div className="stat-value">{upcomingBookings.length}</div>
              <div className="stat-trend trend-positive">
                <span className="trend-text">προγραμματισμένα</span>
              </div>
            </div>
          </div>

          {/* Upcoming Bookings Section */}
          {upcomingBookings.length > 0 && (
            <div className="dashboard-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Επόμενες Κρατήσεις</h3>
                  <p className="card-subtitle">Τα προγραμματισμένα παιχνίδιά σας</p>
                </div>
              </div>
              <div className="card-content">
                <div className="bookings-grid">
                  {upcomingBookings.map((bookingRequest) => (
                    <div
                      key={bookingRequest.booking.id}
                      className="booking-item enhanced"
                    >
                      <div className="booking-info">
                        <div className="booking-court">
                          {bookingRequest.booking.court.name}
                          <span className="court-type-env">
                            {COURT_TYPES_GREEK[bookingRequest.booking.court.courtType]}{" "}
                            •{" "}
                            {COURT_ENVIRONMENT_GREEK[bookingRequest.booking.court.environment]}
                          </span>
                        </div>
                        <div className="booking-location">
                          {bookingRequest.booking.court.address}
                        </div>
                        <div className="booking-details">
                          <span className="booking-date">
                            {formatDate(
                              new Date(bookingRequest.booking.dateTime).toISOString().split('T')[0],
                            )}
                          </span>
                          <span className="booking-time">
                            {(() => {
                              const bookingDateTime = new Date(bookingRequest.booking.dateTime);
                              const startTime = bookingDateTime.toTimeString().substring(0, 5);
                              const endDateTime = new Date(bookingDateTime.getTime() + (bookingRequest.booking.court.slotDuration || 1.5) * 60 * 60 * 1000);
                              const endTime = endDateTime.toTimeString().substring(0, 5);
                              return `${formatTime(startTime)} - ${formatTime(endTime)}`;
                            })()}
                          </span>
                        </div>
                        <div className="booking-players">
                          <div className="players-header">
                            Παίκτες ({bookingRequest.players.length})
                          </div>
                          <div className="players-list">
                            {bookingRequest.players.map((player, index) => (
                              <div key={index} className="player-row">
                                <div className="player-avatar">
                                  {player.playerName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </div>
                                <div className="player-info">
                                  <div className="player-name">{player.playerName}</div>
                                  <div className="player-email">{player.playerEmail}</div>
                                  <div className="player-contact">{player.playerPhone}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="booking-status">
                        {getStatusBadge(bookingRequest.booking.status)}
                        {canCancelBooking(bookingRequest) && (
                          <button
                            className="btn btn-cancel"
                            onClick={() => handleCancelClick(bookingRequest)}
                            title="Ακύρωση κράτησης (θα επιστραφεί το ποσό)"
                          >
                            Ακυρωση
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* All Bookings Section */}
          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Όλες οι Κρατήσεις</h3>
                <p className="card-subtitle">
                  {pagination.totalElements > 0
                    ? `Βρέθηκαν ${pagination.totalElements} κράτησ${pagination.totalElements !== 1 ? "εις" : "η"}`
                    : "Δεν βρέθηκαν κρατήσεις"}
                </p>
              </div>
              {pagination.totalElements > 0 && (
                <div className="page-size-selector">
                  <label className="page-size-label">Γραμμες ανα σελιδα:</label>
                  <select
                    className="page-size-select"
                    value={pageSize}
                    onChange={(e) =>
                      handlePageSizeChange(Number(e.target.value))
                    }
                  >
                    <option value={4}>2 γραμμές (4 κρατήσεις)</option>
                    <option value={6}>3 γραμμές (6 κρατήσεις)</option>
                    <option value={8}>4 γραμμές (8 κρατήσεις)</option>
                    <option value={10}>5 γραμμές (10 κρατήσεις)</option>
                  </select>
                </div>
              )}
            </div>
            <div className="card-content">
              {bookings.length > 0 ? (
                <>
                  <div className="bookings-grid">
                    {bookings.map((bookingRequest) => (
                      <div
                        key={bookingRequest.booking.id}
                        className="booking-item enhanced"
                      >
                        <div className="booking-info">
                          <div className="booking-court">
                            {bookingRequest.booking.court.name}
                            <span className="court-type-env">
                              {COURT_TYPES_GREEK[bookingRequest.booking.court.courtType]}{" "}
                              •{" "}
                              {COURT_ENVIRONMENT_GREEK[bookingRequest.booking.court.environment]}
                            </span>
                          </div>
                          <div className="booking-location">
                            {bookingRequest.booking.court.address}
                          </div>
                          <div className="booking-details">
                            <span className="booking-date">
                              {formatDate(
                                new Date(bookingRequest.booking.dateTime).toISOString().split('T')[0],
                              )}
                            </span>
                            <span className="booking-time">
                              {(() => {
                                const bookingDateTime = new Date(bookingRequest.booking.dateTime);
                                const startTime = bookingDateTime.toTimeString().substring(0, 5);
                                const endDateTime = new Date(bookingDateTime.getTime() + (bookingRequest.booking.court.slotDuration || 1.5) * 60 * 60 * 1000);
                                const endTime = endDateTime.toTimeString().substring(0, 5);
                                return `${formatTime(startTime)} - ${formatTime(endTime)}`;
                              })()}
                            </span>
                          </div>
                          <div className="booking-players">
                            <div className="players-header">
                              Παίκτες ({bookingRequest.players.length})
                            </div>
                            <div className="players-list">
                              {bookingRequest.players.map((player, index) => (
                                <div key={index} className="player-row">
                                  <div className="player-avatar">
                                    {player.playerName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </div>
                                  <div className="player-info">
                                    <div className="player-name">{player.playerName}</div>
                                    <div className="player-contact">{player.playerPhone}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {bookingRequest.booking.notes && (
                            <div className="booking-notes">
                              {bookingRequest.booking.notes}
                            </div>
                          )}
                        </div>
                                                <div className="booking-status">
                          {getStatusBadge(bookingRequest.booking.status)}
                          {isUpcoming(bookingRequest) && (
                            <div className="booking-upcoming-indicator">
                              Επόμενο
                            </div>
                          )}
                          {canCancelBooking(bookingRequest) && (
                            <button
                              className="btn btn-cancel"
                              onClick={() => handleCancelClick(bookingRequest)}
                              title="Ακύρωση κράτησης (θα επιστραφεί το ποσό)"
                            >
                              Ακυρωση
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="pagination-container">
                      <div className="pagination">
                        <button
                          className="pagination-btn"
                          disabled={pagination.currentPage === 0}
                          onClick={() =>
                            handlePageChange(pagination.currentPage - 1)
                          }
                        >
                          Προηγούμενη
                        </button>

                        <div className="pagination-info">
                          Σελίδα {pagination.currentPage + 1} από{" "}
                          {pagination.totalPages}
                        </div>

                        <button
                          className="pagination-btn"
                          disabled={
                            pagination.currentPage >= pagination.totalPages - 1
                          }
                          onClick={() =>
                            handlePageChange(pagination.currentPage + 1)
                          }
                        >
                          Επόμενη
                        </button>
                      </div>

                      <div className="results-info">
                        Εμφάνιση {bookings.length} από {pagination.totalElements}{" "}
                        κρατήσεις
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <line x1="10" y1="9" x2="8" y2="9"></line>
                    </svg>
                  </div>
                  <h4 className="empty-title">Δεν βρέθηκαν κρατήσεις</h4>
                  <p className="empty-description">
                    Δεν έχετε κάνει κρατήσεις ακόμα. Είστε έτοιμοι να κάνετε την πρώτη σας κράτηση;
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
                </>
      )}

      {/* Cancel Booking Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={handleCancelModalClose}
        onConfirm={handleCancelConfirm}
        title="Ακύρωση Κράτησης"
        message={
          bookingToCancel
            ? (() => {
                const bookingDateTime = new Date(bookingToCancel.booking.dateTime);
                const startTime = bookingDateTime.toTimeString().substring(0, 5);
                const dateStr = bookingDateTime.toISOString().split('T')[0];
                return `Είστε σίγουροι ότι θέλετε να ακυρώσετε την κράτηση σας για το ${bookingToCancel.booking.court.name} στις ${formatDate(dateStr)} στις ${formatTime(startTime)}; Η πληρωμή σας θα επιστραφεί.`;
              })()
            : ""
        }
        confirmText="Ακυρωση Κρατησης"
        cancelText="Διατηρηση Κρατησης"
        isLoading={cancelling}
        type="danger"
      />

      {/* Success Message Modal */}
      <MessageModal
        isOpen={showSuccessModal}
        type="success"
        title="Η Κράτηση Ακυρώθηκε Επιτυχώς"
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
        confirmText="Εντάξει"
      />
    </UserLayout>
  );
};

export default MyBookings;
