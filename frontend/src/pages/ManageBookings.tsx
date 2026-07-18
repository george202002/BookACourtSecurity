import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import AddBooking from "../components/AddBooking";
import EditBooking from "../components/EditBooking";
import ConfirmationModal from "../components/ConfirmationModal";
import MessageModal from "../components/MessageModal";
import LoadingSkeleton from "../components/LoadingSkeleton";
import type { CourtResponse } from "../dtos/Court";
import type { BookingRequest } from "../dtos/Booking";
import {
  COURT_TYPES_GREEK,
  COURT_ENVIRONMENT_GREEK,
  getCitiesForDropdown,
  GREEK_CITY_DISPLAY_NAMES,
  type CourtType,
  type CourtEnvironment,
} from "../enums/CourtEnums";
import {
  getAdminBookings,
  updateBooking,
  deleteBooking,
  createBooking,
} from "../services/BookingsService";
import type { PaginatedBookingsResponse } from "../services/BookingsService";
import { getCourts } from "../services/CourtsService";
import { formatDateForDisplay } from "../utils/DateUtils";
import { formatDateFromForZonedDateTime, formatDateToForZonedDateTime, validateDateRange } from "../utils/DateUtils";
import type { FilterCriteria } from "../dtos/FilterCriteria";

const ManageBookings = () => {
  const navigate = useNavigate();
  const [paginatedResponse, setPaginatedResponse] =
    useState<PaginatedBookingsResponse | null>(null);
  const [courts, setCourts] = useState<CourtResponse[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookingRequest | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<BookingRequest | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Success message modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(6); // Default 6 bookings per page (2 per row × 3 rows)

  // Filter states
  const [filters, setFilters] = useState<FilterCriteria>({
    admin: true,
  });

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load bookings when pagination changes
  useEffect(() => {
    if (courts.length > 0) {
      loadBookings();
    }
  }, [currentPage, pageSize, courts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiFilters: FilterCriteria = {
        page: 0,
        size: Number.MAX_VALUE,
        admin: true, // Ensure admin flag is set for admin bookings
      };

      // Load courts first
      const courtsData = await getCourts(navigate, apiFilters);
      setCourts(courtsData.content);

      // Load bookings
      await Promise.all([loadBookings()]);
    } catch (err) {
      setError("Αποτυχία φόρτωσης δεδομένων. Παρακαλώ δοκιμάστε ξανά.");
      console.error("Error loading initial data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate date range before sending to backend
      if (!validateDateRange(filters.dateFrom, filters.dateTo)) {
        setError("Η Ημερομηνία Από δεν μπορεί να είναι μετά την Ημερομηνία Έως");
        return;
      }

      const apiFilters: FilterCriteria = {
        page: currentPage,
        size: pageSize,
        dateFrom: formatDateFromForZonedDateTime(filters.dateFrom || ""),
        dateTo: formatDateToForZonedDateTime(filters.dateTo || ""),
        admin: true,
      };

      if (filters.searchTerm?.trim()) {
        apiFilters.searchTerm = filters.searchTerm.trim();
      }
      if (filters.city) {
        apiFilters.city = filters.city;
      }
      if (filters.courtType) {
        apiFilters.courtType = filters.courtType;
      }
      if (filters.environment) {
        apiFilters.environment = filters.environment;
      }
      if (filters.status && filters.status !== "all") {
        apiFilters.status = filters.status as BookingRequest["booking"]["status"];
      }
      if (filters.courtId) {
        apiFilters.courtId = filters.courtId;
      }

      const response = await getAdminBookings(navigate, apiFilters);

      setPaginatedResponse(response);
      setError(null);
    } catch (err) {
      setError("Αποτυχία φόρτωσης κρατήσεων. Παρακαλώ δοκιμάστε ξανά.");
      console.error("Error loading bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBooking = async (bookingRequest: BookingRequest) => {
    try {
      setError(null);
      await createBooking(bookingRequest, navigate);
      setShowAddForm(false);
      await Promise.all([loadBookings()]);
    } catch (err) {
      setError("Αποτυχία δημιουργίας κράτησης. Παρακαλώ δοκιμάστε ξανά.");
      console.error("Error creating booking:", err);
    }
  };

  const handleUpdateBooking = async (
    id: string,
    bookingRequest: BookingRequest,
  ) => {
    try {
      setError(null);
      await updateBooking(id, bookingRequest, navigate);
      setEditingBooking(null);
      await Promise.all([loadBookings()]);
    } catch (err) {
      setError("Αποτυχία ενημέρωσης κράτησης. Παρακαλώ δοκιμάστε ξανά.");
      console.error("Error updating booking:", err);
    }
  };

  const handleDeleteBooking = (booking: BookingRequest) => {
    setBookingToDelete(booking);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteBooking = async () => {
    if (!bookingToDelete) return;

    try {
      setDeleteLoading(true);
      setError(null);
      await deleteBooking(bookingToDelete.booking.id, navigate);

      // Show success message
      const bookingDateTime = new Date(bookingToDelete.booking.dateTime);
      const courtName = bookingToDelete.booking.court.name;
      const dateStr = bookingDateTime.toISOString().split('T')[0];
      setSuccessMessage(
        `Η κράτηση για το γήπεδο "${courtName}" στις ${formatDateForDisplay(dateStr)} διαγράφηκε επιτυχώς.`
      );
      setShowSuccessModal(true);

      setShowDeleteConfirmation(false);
      setBookingToDelete(null);
      await Promise.all([loadBookings()]);
    } catch (err) {
      setError("Αποτυχία διαγραφής κράτησης. Παρακαλώ δοκιμάστε ξανά.");
      console.error("Error deleting booking:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDeleteBooking = () => {
    setShowDeleteConfirmation(false);
    setBookingToDelete(null);
    setDeleteLoading(false);
  };



  // Filter helper functions
  const handleFilterChange = (
    key: keyof FilterCriteria,
    value: string | number | undefined,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setCurrentPage(0); // Reset to first page when searching
    loadBookings();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      city: "",
      courtType: "" as CourtType,
      environment: "" as CourtEnvironment,
      status: "" as BookingRequest["booking"]["status"],
      courtId: undefined,
      dateFrom: "",
      dateTo: "",
      admin: true,
    });
    setCurrentPage(0); // Reset to first page
    // Auto-search after clearing filters
    setTimeout(() => {
      loadBookings();
    }, 0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0); // Reset to first page when changing page size
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FILLED":
        return <span className="status-badge status-filled">Γεματη</span>;
      case "PENDING":
        return <span className="status-badge status-pending">Σε Εκκρεμοτητα</span>;
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

  return (
    <AdminLayout>
      <div className="manage-bookings-container">
        {error && <div className="error-message">{error}</div>}
        <div className="bookings-header">
          <div className="header-content">
            <h1 className="page-title">Διαχείριση Κρατήσεων</h1>
            <p className="page-subtitle">
              Προβολή, διαχείριση και παρακολούθηση όλων των κρατήσεων γηπέδων
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
            disabled={loading}
          >
            Προσθηκη Νεας Κρατησης
          </button>
        </div>

        {/* Booking Statistics */}
        <div className="bookings-stats">
          <div className="stat-item">
            <div className="stat-value">
              {paginatedResponse?.totalElements || 0}
            </div>
            <div className="stat-label">Συνολο Κρατησεων</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {paginatedResponse?.content.filter(
                (b) => b.booking.status === "COMPLETED",
              ).length || 0}
            </div>
            <div className="stat-label">Ολοκληρωμενες</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {paginatedResponse?.content.filter(
                (b) => b.booking.status === "OPEN",
              ).length || 0}
            </div>
            <div className="stat-label">Ανοιχτες</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              €
              {((paginatedResponse?.content
                .filter((b) => b.booking.status === "COMPLETED")
                .reduce(
                  (acc, b) => acc + (b.priceInCents || 0),
                  0,
                ) || 0) / 100).toFixed(2)}
            </div>
            <div className="stat-label">Εσοδα Απο Ολοκληρωμενες</div>
          </div>
        </div>

        {/* Comprehensive Filters */}
        <div className="admin-filters-card">
          <div className="filters-header">
            <div className="filters-title">
              <h3>Φιλτράρισμα Κρατήσεων</h3>
              <p>Αναζήτηση και φιλτράρισμα κρατήσεων</p>
            </div>
            <div className="filter-actions">
              <button
                className="btn btn-secondary"
                onClick={clearFilters}
                disabled={loading}
              >
                Καθαρισμος Ολων
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSearch}
                disabled={loading}
              >
                Αναζητηση
              </button>
            </div>
          </div>
          <div className="admin-filters-grid">
            {/* Player Search */}
            <div className="admin-filter-group">
              <label className="admin-filter-label">Αναζητηση Παικτη</label>
              <input
                type="text"
                className="admin-filter-input"
                placeholder="Αναζήτηση ονόματος..."
                value={filters.searchTerm || ""}
                onChange={(e) =>
                  handleFilterChange("searchTerm", e.target.value)
                }
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
            </div>

            {/* City */}
            <div className="admin-filter-group">
              <label className="admin-filter-label">Πολη</label>
              <select
                className="admin-filter-select"
                value={filters.city || ""}
                onChange={(e) => handleFilterChange("city", e.target.value)}
                disabled={loading}
              >
                <option value="">Όλες οι Πόλεις</option>
                {getCitiesForDropdown().map((city) => (
                  <option key={city.key} value={city.key}>
                    {city.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Court Type */}
            <div className="admin-filter-group">
              <label className="admin-filter-label">Τυπος Αθληματος</label>
              <select
                className="admin-filter-select"
                value={filters.courtType || ""}
                onChange={(e) =>
                  handleFilterChange("courtType", e.target.value)
                }
                disabled={loading}
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
            <div className="admin-filter-group">
              <label className="admin-filter-label">Περιβαλλον</label>
              <select
                className="admin-filter-select"
                value={filters.environment || ""}
                onChange={(e) =>
                  handleFilterChange("environment", e.target.value)
                }
                disabled={loading}
              >
                <option value="">Εσωτερικό και Εξωτερικό</option>
                {Object.entries(COURT_ENVIRONMENT_GREEK).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="admin-filter-group">
              <label className="admin-filter-label">Κατασταση</label>
              <select
                className="admin-filter-select"
                value={filters.status || "all"}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                disabled={loading}
              >
                <option value="all">Όλες οι Καταστάσεις</option>
                <option value="FILLED">Γεμάτο</option>
                <option value="OPEN">Ανοιχτό</option>
                <option value="CANCELLED">Ακυρωμένο</option>
                <option value="COMPLETED">Ολοκληρωμένο</option>
              </select>
            </div>

            {/* Specific Court */}
            <div className="admin-filter-group">
              <label className="admin-filter-label">Συγκεκριμενο Γηπεδο</label>
              <select
                className="admin-filter-select"
                value={filters.courtId || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "courtId",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                disabled={loading}
              >
                <option value="">Όλα τα Γήπεδα</option>
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name} ({court.city ? GREEK_CITY_DISPLAY_NAMES[court.city] : "Άγνωστο"} •{" "}
                    {court.courtType})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="admin-filter-group">
              <label className="admin-filter-label">Ημερομηνια Απο</label>
              <input
                type="date"
                className={`admin-filter-input ${
                  filters.dateFrom && filters.dateTo && !validateDateRange(filters.dateFrom, filters.dateTo)
                    ? "error"
                    : ""
                }`}
                value={filters.dateFrom || ""}
                onChange={(e) => {
                  const newDateFrom = e.target.value;
                  handleFilterChange("dateFrom", newDateFrom);
                  // If dateTo is set and is earlier than new dateFrom, clear dateTo
                  if (filters.dateTo && newDateFrom && newDateFrom > filters.dateTo) {
                    handleFilterChange("dateTo", "");
                  }
                }}
                disabled={loading}
              />
            </div>

            <div className="admin-filter-group">
              <label className="admin-filter-label">Ημερομηνια Εως</label>
              <input
                type="date"
                className={`admin-filter-input ${
                  filters.dateFrom && filters.dateTo && !validateDateRange(filters.dateFrom, filters.dateTo)
                    ? "error"
                    : ""
                }`}
                value={filters.dateTo || ""}
                min={filters.dateFrom || undefined}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                disabled={loading}
              />
              {filters.dateFrom && filters.dateTo && !validateDateRange(filters.dateFrom, filters.dateTo) && (
                <small className="error-message">Η Ημερομηνία Έως πρέπει να είναι ίδια ή μετά την Ημερομηνία Από</small>
              )}
            </div>
          </div>
        </div>

        {/* Add Booking Form Component */}
        <AddBooking
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onAddBooking={handleAddBooking}
          courts={courts}
        />

        {/* Edit Booking Form Component */}
        <EditBooking
          bookingReq={editingBooking}
          isOpen={!!editingBooking}
          onClose={() => setEditingBooking(null)}
          onUpdateBooking={handleUpdateBooking}
          courts={courts}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteConfirmation}
          onClose={cancelDeleteBooking}
          onConfirm={confirmDeleteBooking}
          title="Διαγραφή Κράτησης"
          message={`Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την κράτηση; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί. Εάν οι παίκτες είναι μέλη της εφαρμογής τα χρήματα θα επιστραφούν αυτόματα.`}
          confirmText="Διαγραφη Κρατησης"
          cancelText="Ακυρωση"
          type="danger"
          isLoading={deleteLoading}
        />

        {/* Success Message Modal */}
        <MessageModal
          isOpen={showSuccessModal}
          type="success"
          title="Η Κράτηση Διαγράφηκε Επιτυχώς"
          message={successMessage}
          onClose={() => setShowSuccessModal(false)}
        />

        {/* Results Summary */}
        {paginatedResponse && (
          <div className="results-summary">
            <div className="results-info">
              <h3>Αποτελέσματα Κρατήσεων</h3>
              <p>
                Εμφάνιση {paginatedResponse.numberOfElements} από{" "}
                {paginatedResponse.totalElements} κρατήσεις
              </p>
            </div>
            {paginatedResponse && (
              <div className="admin-page-size-selector">
                <label className="page-size-label">Γραμμες ανα σελιδα:</label>
                <select
                  className="admin-filter-select"
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                >
                  <option value={4}>2 γραμμές (4 κρατήσεις)</option>
                  <option value={6}>3 γραμμές (6 κρατήσεις)</option>
                  <option value={8}>4 γραμμές (8 κρατήσεις)</option>
                  <option value={10}>5 γραμμές (10 κρατήσεις)</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Bookings List */}
        <div className="bookings-grid">
          {loading && !paginatedResponse ? (
            <LoadingSkeleton variant="bookings" count={6} />
          ) : paginatedResponse?.content.map((bookingReq) => {
            return (
              <div
                key={bookingReq.booking.id}
                className={`booking-card ${bookingReq.booking.status || "pending"}`}
              >
                <div className="booking-header">
                  <div className="booking-info">
                    <h3 className="booking-court">
                      {bookingReq.booking.court.name}
                    </h3>
                    <p className="booking-date">
                      {formatDateForDisplay(
                        new Date(bookingReq.booking.dateTime).toISOString().split('T')[0],
                      )}
                    </p>
                    <p className="booking-time">
                      {(() => {
                        const bookingDateTime = new Date(bookingReq.booking.dateTime);
                        const startTime = bookingDateTime.toTimeString().substring(0, 5);
                        const endDateTime = new Date(bookingDateTime.getTime() + (bookingReq.booking.court.slotDuration || 1.5) * 60 * 60 * 1000);
                        const endTime = endDateTime.toTimeString().substring(0, 5);
                        return `${formatTime(startTime)} - ${formatTime(endTime)}`;
                      })()}
                    </p>
                  </div>
                  <div className="booking-actions">
                    {getStatusBadge(bookingReq.booking.status)}
                    <button
                      className="edit-button"
                      onClick={() => setEditingBooking(bookingReq)}
                      disabled={loading || !(bookingReq.booking.status === "OPEN" || bookingReq.booking.status === "FILLED")}
                    >
                      Επεξεργασια
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteBooking(bookingReq)}
                      disabled={loading || !(bookingReq.booking.status === "OPEN" || bookingReq.booking.status === "FILLED")}
                    >
                      Διαγραφη
                    </button>
                  </div>
                </div>

                <div className="booking-details">
                  <div className="booking-price">
                    <span className="price-label">Συνολικη Τιμη</span>
                    <span className="price-value">
                      €{((bookingReq.priceInCents || 0) / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="players-section">
                    <h4 className="players-title">
                      Παικτες ({bookingReq.players.length})
                    </h4>
                    <div className="players-list">
                      {bookingReq.players.map((player, index) => (
                        <div key={index} className="player-row">
                          <div className="player-avatar">
                            {player.playerName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div className="player-details">
                            <div className="player-name">
                              {player.playerName}
                            </div>
                            <div className="player-contact">
                              {player.playerEmail && (
                                <span className="player-email">
                                  {player.playerEmail}
                                </span>
                              )}
                              <span className="player-phone">
                                {player.playerPhone}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {bookingReq.booking.notes && (
                    <div className="booking-notes">
                      <h4 className="notes-title">Σημειωσεις</h4>
                      <p>{bookingReq.booking.notes}</p>
                    </div>
                  )}

                  <div className="booking-timestamps">
                    <div className="timestamp-row">
                      <span className="timestamp-label">Δημιουργήθηκε:</span>
                      <span className="timestamp-value">
                        {bookingReq.booking.createdAt
                          ? new Date(bookingReq.booking.createdAt).toLocaleString('el-GR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Δεν είναι διαθέσιμο'
                        }
                      </span>
                    </div>
                    {bookingReq.booking.updatedAt && (
                      <div className="timestamp-row">
                        <span className="timestamp-label">Ενημερώθηκε:</span>
                        <span className="timestamp-value">
                          {new Date(bookingReq.booking.updatedAt).toLocaleString('el-GR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {paginatedResponse && paginatedResponse.totalPages > 1 && (
          <div className="admin-pagination-container">
            <div className="admin-pagination-info">
              <span>
                Εμφάνιση {paginatedResponse.numberOfElements} από{" "}
                {paginatedResponse.totalElements} κρατήσεις
              </span>
            </div>
            <div className="admin-pagination-controls">
              <button
                className="admin-pagination-btn"
                onClick={() => handlePageChange(0)}
                disabled={paginatedResponse.first}
              >
                Πρώτη
              </button>
              <button
                className="admin-pagination-btn"
                onClick={() => handlePageChange(paginatedResponse.number - 1)}
                disabled={paginatedResponse.first}
              >
                Προηγούμενη
              </button>

              {/* Page Numbers */}
              <div className="admin-page-numbers">
                {Array.from(
                  { length: Math.min(5, paginatedResponse.totalPages) },
                  (_, i) => {
                    const startPage = Math.max(
                      0,
                      Math.min(
                        paginatedResponse.number - 2,
                        paginatedResponse.totalPages - 5,
                      ),
                    );
                    const pageNum = startPage + i;

                    if (pageNum >= paginatedResponse.totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        className={`admin-page-number ${
                          paginatedResponse.number === pageNum ? "active" : ""
                        }`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  },
                )}
              </div>

              <button
                className="admin-pagination-btn"
                onClick={() => handlePageChange(paginatedResponse.number + 1)}
                disabled={paginatedResponse.last}
              >
                Επόμενη
              </button>
              <button
                className="admin-pagination-btn"
                onClick={() =>
                  handlePageChange(paginatedResponse.totalPages - 1)
                }
                disabled={paginatedResponse.last}
              >
                Τελευταία
              </button>
            </div>
          </div>
        )}

        {(!paginatedResponse || paginatedResponse.content.length === 0) &&
          !loading && (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3 className="empty-title">
                {Object.values(filters).some(
                  (value) => value && value !== "all",
                )
                  ? "Δεν Βρέθηκαν Κρατήσεις"
                  : "Δεν έχουν Προστεθεί Κρατήσεις Ακόμα"}
              </h3>
              <p className="empty-description">
                {Object.values(filters).some(
                  (value) => value && value !== "all",
                )
                  ? "Δοκιμάστε να προσαρμόσετε τα φίλτρα σας για να βρείτε περισσότερες κρατήσεις."
                  : "Δεν έχουν γίνει κρατήσεις ακόμα. Προσθέστε την πρώτη σας κράτηση για να ξεκινήσετε."}
              </p>
              {Object.values(filters).some(
                (value) => value && value !== "all",
              ) ? (
                <button className="btn btn-primary" onClick={clearFilters}>
                  Καθαρισμός Φίλτρων
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddForm(true)}
                  disabled={loading}
                >
                  Προσθήκη Πρώτης Κράτησης
                </button>
              )}
            </div>
          )}
      </div>
    </AdminLayout>
  );
};

export default ManageBookings;
