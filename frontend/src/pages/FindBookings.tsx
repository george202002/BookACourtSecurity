import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import JoinBookingModal from "../components/JoinBookingModal";
import MessageModal, { type MessageType } from "../components/MessageModal";
import LoadingSkeleton from "../components/LoadingSkeleton";
import type { BookingRequest } from "../dtos/Booking";
import {
  getOpenBookings,
  type PaginatedBookingsResponse,
} from "../services/BookingsService";
import {
  COURT_TYPES_GREEK,
  getCitiesForDropdown,
  type GreekCity,
  type CourtEnvironment,
  type CourtType,
  COURT_ENVIRONMENT_GREEK,
} from "../enums/CourtEnums";
import type { FilterCriteria } from "../dtos/FilterCriteria";
import { formatDateFromForZonedDateTime, formatDateToForZonedDateTime, validateDateRange } from "../utils/DateUtils";

interface IncompleteBooking extends BookingRequest {
  availableSpots: number;
  maxPlayers: number;
  pricePerPlayer: number;
}

const FindBookings = () => {
  const navigate = useNavigate();
  const [paginatedResponse, setPaginatedResponse] =
    useState<PaginatedBookingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  const [selectedCity, setSelectedCity] = useState<GreekCity | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<CourtType | undefined>(undefined);
  const [selectedEnvironment, setSelectedEnvironment] = useState<CourtEnvironment | undefined>(undefined);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(6); // Default 6 bookings per page (2 per row × 3 rows)

  // Join modal states
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(
    null,
  );

  // Message modal states
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageType, setMessageType] = useState<MessageType>("success");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageText, setMessageText] = useState("");

  // Load bookings on mount
  useEffect(() => {
    loadBookings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load bookings when pagination changes
  useEffect(() => {
    loadBookings();
  }, [currentPage, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear price range when court type changes
  useEffect(() => {
    if (selectedType) {
      // Clear price range when switching court types as calculations differ
      setPriceRange({ min: "", max: "" });
    }
  }, [selectedType]);

  const loadBookings = async () => {
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
      if (priceRange.min && !isNaN(parseFloat(priceRange.min)) && selectedType) {
        filters.minPrice =
          parseFloat(priceRange.min) * getMaxPlayersForCourt(selectedType) || 0;
      }
      if (priceRange.max && !isNaN(parseFloat(priceRange.max)) && selectedType) {
        filters.maxPrice =
          parseFloat(priceRange.max) * getMaxPlayersForCourt(selectedType) || 0;
      }
      // Format dates as ISO 8601 with time for Java ZonedDateTime parsing
      if (dateFrom) {
        filters.dateFrom = formatDateFromForZonedDateTime(dateFrom);
      }
      if (dateTo) {
        filters.dateTo = formatDateToForZonedDateTime(dateTo);
      }

      const response = await getOpenBookings(navigate, filters);
      setPaginatedResponse(response);
    } catch (err) {
      const errorMessage = "Αποτυχία φόρτωσης κρατήσεων. Παρακαλώ δοκιμάστε ξανά.";
      setError(errorMessage);
      console.error("Error loading bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const getMaxPlayersForCourt = (courtType: string) => {
    switch (courtType) {
      case "Padel":
        return 4;
      case "Tennis":
        return 2; // Singles
      case "Basketball":
        return 10; // 5v5
      case "Football":
        return 22; // 11v11
      default:
        return 10;
    }
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

  const clearFilters = async () => {
    setSearchTerm(undefined);
    setSelectedCity(undefined);
    setSelectedType(undefined);
    setSelectedEnvironment(undefined);
    setPriceRange({ min: "", max: "" });
    setDateFrom("");
    setDateTo("");
    setCurrentPage(0); // Reset to first page

    // Load bookings with empty filters immediately
    try {
      setLoading(true);
      setError(null);

      const filters: FilterCriteria = {
        page: 0, // Use 0 since we just reset currentPage
        size: pageSize,
        admin: false,
      };

      const response = await getOpenBookings(navigate, filters);
      setPaginatedResponse(response);
    } catch (err) {
      const errorMessage = "Αποτυχία φόρτωσης κρατήσεων. Παρακαλώ δοκιμάστε ξανά.";
      setError(errorMessage);
      showMessage("error", "Σφάλμα Φόρτωσης", errorMessage);
      console.error("Error loading bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0); // Reset to first page when changing page size
  };

  const getEnrichedBooking = (bookingReq: BookingRequest): IncompleteBooking => {
    const maxPlayers = getMaxPlayersForCourt(
      bookingReq.booking.court.courtType,
    );
    const pricePerPlayer =
      bookingReq.booking.court.price / maxPlayers;
    const availableSpots = maxPlayers - bookingReq.players.length;

    return {
      ...bookingReq,
      availableSpots,
      maxPlayers,
      pricePerPlayer,
    };
  };

  const getPlayerPosition = (index: number, courtType: string) => {
    // Define positions based on court type and player index
    const positions = {
      Padel: [
        { x: 20, y: 30 }, // Player 1
        { x: 80, y: 30 }, // Player 2
        { x: 20, y: 70 }, // Player 3
        { x: 80, y: 70 }, // Player 4
      ],
      Tennis: [
        { x: 50, y: 30 }, // Player 1
        { x: 50, y: 70 }, // Player 2
      ],
      Basketball: [
        { x: 15, y: 25 },
        { x: 35, y: 25 },
        { x: 50, y: 25 },
        { x: 65, y: 25 },
        { x: 85, y: 25 }, // Team 1
        { x: 15, y: 75 },
        { x: 35, y: 75 },
        { x: 50, y: 75 },
        { x: 65, y: 75 },
        { x: 85, y: 75 }, // Team 2
      ],
      Football: [
        // Goalkeeper and defenders
        { x: 10, y: 50 },
        { x: 25, y: 30 },
        { x: 25, y: 50 },
        { x: 25, y: 70 },
        { x: 40, y: 40 },
        { x: 40, y: 60 },
        // Midfield and forwards
        { x: 55, y: 35 },
        { x: 55, y: 65 },
        { x: 70, y: 30 },
        { x: 70, y: 50 },
        { x: 70, y: 70 },
        // Opposing team
        { x: 90, y: 50 },
        { x: 75, y: 30 },
        { x: 75, y: 50 },
        { x: 75, y: 70 },
        { x: 60, y: 40 },
        { x: 60, y: 60 },
        { x: 45, y: 35 },
        { x: 45, y: 65 },
        { x: 30, y: 30 },
        { x: 30, y: 50 },
        { x: 30, y: 70 },
      ],
    };

    const courtPositions =
      positions[courtType as keyof typeof positions] || positions.Padel;

    if (index < courtPositions.length) {
      return courtPositions[index];
    }

    // For additional players, position them around the court
    const fallbackPositions = [
      { x: 50, y: 15 },
      { x: 50, y: 85 },
      { x: 15, y: 50 },
      { x: 85, y: 50 },
      { x: 30, y: 20 },
      { x: 70, y: 20 },
      { x: 30, y: 80 },
      { x: 70, y: 80 },
    ];

    return (
      fallbackPositions[index % fallbackPositions.length] || { x: 50, y: 50 }
    );
  };

  const getPlayerInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);
  };

  const getCourtBackgroundImage = (courtType: string) => {
    switch (courtType) {
      case "Padel":
        return "/images/courts/padel-court.jpg";
      case "Tennis":
        return "/images/courts/tennis-court.jpg";
      case "Basketball":
        return "/images/courts/basketball-court.jpg";
      case "Football":
        return "/images/courts/football-court.jpg";
      default:
        return "/images/courts/default-court.jpg";
    }
  };

  const getCourtBackgroundFallback = (courtType: string) => {
    // CSS gradient fallbacks if images don't load
    switch (courtType) {
      case "Padel":
        return "linear-gradient(135deg, #2d5a27 0%, #4a7c59 50%, #2d5a27 100%)";
      case "Basketball":
        return "linear-gradient(135deg, #d2691e 0%, #cd853f 50%, #d2691e 100%)";
      case "Football":
        return "linear-gradient(135deg, #228b22 0%, #32cd32 50%, #228b22 100%)";
      default:
        return "linear-gradient(135deg, #4a90e2 0%, #357abd 50%, #4a90e2 100%)";
    }
  };

  const handleJoinBooking = (booking: BookingRequest) => {
    setSelectedBooking(booking);
    setShowJoinModal(true);
  };

  const handleJoinSuccess = () => {
    setMessageType("success");
    setMessageTitle("Συμμετοχή σε Κράτηση Επιτυχής!");
    setMessageText(
      "Μπήκατε επιτυχώς στην κράτηση! Ελέγξτε το email σας για λεπτομέρειες επιβεβαίωσης.",
    );
    setShowMessageModal(true);
    // Reload bookings to update the list
    loadBookings();
  };

  const handleCloseMessageModal = () => {
    setShowMessageModal(false);
  };

  const showMessage = (type: MessageType, title: string, message: string) => {
    setMessageType(type);
    setMessageTitle(title);
    setMessageText(message);
    setShowMessageModal(true);
  };

  const handleCloseJoinModal = () => {
    setShowJoinModal(false);
    setSelectedBooking(null);
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("el-GR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("el-GR", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="page-header">
          <h1 className="page-title">Εύρεση Κρατήσεων για Συμμετοχή</h1>
          <p className="page-subtitle">
            Συμμετέχετε με άλλους παίκτες και μοιραστείτε το κόστος!
          </p>
        </div>
        <LoadingSkeleton variant="filters" />
        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <div className="skeleton skeleton-title" style={{ width: '200px', height: '24px' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '180px', height: '16px', marginTop: '8px' }}></div>
            </div>
          </div>
          <div className="card-content">
            <LoadingSkeleton variant="courts" count={6} />
          </div>
        </div>
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout>
        <div className="page-header">
          <h1 className="page-title">Εύρεση Κρατήσεων για Συμμετοχή</h1>
          <p className="page-subtitle">
            Συμμετέχετε με άλλους παίκτες και μοιραστείτε το κόστος!
          </p>
        </div>
        <div className="dashboard-card">
          <div className="card-content">
            <div className="empty-state">
              <h4 className="empty-title">Σφάλμα φόρτωσης κρατήσεων</h4>
              <p className="empty-description">{error}</p>
              <button className="btn btn-primary" onClick={loadBookings}>
                Δοκιμάστε Ξανά
              </button>
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="page-header">
        <h1 className="page-title">Εύρεση Κρατήσεων για Συμμετοχή</h1>
        <p className="page-subtitle">Συμμετέχετε με άλλους παίκτες και μοιραστείτε το κόστος!</p>
      </div>

      {/* Filters Section */}
      <div className="dashboard-card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Φιλτράρισμα Κρατήσεων</h3>
            <p className="card-subtitle">Βρείτε το τέλειο παιχνίδι για συμμετοχή</p>
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
                placeholder="Αναζητηση ονόματος..."
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

            {/* Price Range */}
            <div className="filter-group">
              <label className="filter-label">Τιμη ανα Παικτη</label>
              {!selectedType && (
                <p className="filter-info-text">
                  Επιλέξτε πρώτα άθλημα για να ενεργοποιηθεί το φίλτρο τιμής
                </p>
              )}
              <div className="price-range-inputs">
                <input
                  type="number"
                  className={`filter-input price-input ${!selectedType ? "disabled" : ""}`}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="Ελάχ. €"
                  value={priceRange.min}
                  disabled={!selectedType}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, min: e.target.value })
                  }
                />
                <span className="price-separator">-</span>
                <input
                  type="number"
                  className={`filter-input price-input ${!selectedType ? "disabled" : ""}`}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="Μέγ. €"
                  value={priceRange.max}
                  disabled={!selectedType}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, max: e.target.value })
                  }
                />
              </div>
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

      {/* Results Section */}
      <div className="dashboard-card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Διαθέσιμες Κρατήσεις</h3>
            <p className="card-subtitle">
              {paginatedResponse
                ? `${paginatedResponse.totalElements} κράτησ${paginatedResponse.totalElements !== 1 ? "εις" : "η"} αναζητούν παίκτες`
                : "Φόρτωση κρατήσεων..."}
            </p>
          </div>
          {paginatedResponse && (
            <div className="page-size-selector">
              <label className="page-size-label">Γραμμες ανα σελιδα:</label>
              <select
                className="page-size-select"
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
        <div className="card-content">
          {paginatedResponse && paginatedResponse.content.length > 0 ? (
            <div className="bookings-grid">
              {paginatedResponse.content.map((booking) => {
                const enrichedBooking = getEnrichedBooking(booking);
                return (
                  <div
                    key={enrichedBooking.booking.id}
                    className="booking-card-visual"
                    style={{
                      background: getCourtBackgroundFallback(
                        enrichedBooking.booking.court.courtType,
                      ),
                      backgroundImage: `url(${getCourtBackgroundImage(enrichedBooking.booking.court.courtType)})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    {/* Court Background with Overlay */}
                    <div className="court-background">
                      <div className="court-overlay"></div>

                      {/* Simple Header */}
                      <div className="court-header-simple">
                        <h4 className="court-name-simple">
                          {enrichedBooking.booking.court.name}
                        </h4>
                        <div className="price-simple">
                          €{enrichedBooking.pricePerPlayer.toFixed(2)}
                        </div>
                      </div>

                      {/* Players on Court */}
                      <div className="players-on-court">
                        {/* Current Players */}
                        {enrichedBooking.players.map((player, index) => (
                          <div
                            key={index}
                            className="player-avatar-simple"
                            style={{
                              left: `${getPlayerPosition(index, enrichedBooking.booking.court.courtType).x}%`,
                              top: `${getPlayerPosition(index, enrichedBooking.booking.court.courtType).y}%`,
                            }}
                            title={player.playerName}
                          >
                            <div className="avatar-circle-simple">
                              {getPlayerInitials(player.playerName)}
                            </div>
                          </div>
                        ))}

                        {/* Available Spots */}
                        {Array.from(
                          { length: enrichedBooking.availableSpots },
                          (_, index) => (
                            <div
                              key={`spot-${index}`}
                              className="available-spot-simple"
                              style={{
                                left: `${getPlayerPosition(enrichedBooking.players.length + index, enrichedBooking.booking.court.courtType).x}%`,
                                top: `${getPlayerPosition(enrichedBooking.players.length + index, enrichedBooking.booking.court.courtType).y}%`,
                              }}
                              onClick={() => handleJoinBooking(booking)}
                              title="Κάντε κλικ για συμμετοχή"
                            >
                              <div className="join-circle-simple">+</div>
                            </div>
                          ),
                        )}
                      </div>

                      {/* Simple Footer */}
                      <div className="court-footer-simple">
                        <span className="court-info-simple">
                          {formatDate(
                            new Date(enrichedBooking.booking.dateTime).toISOString().split('T')[0],
                          )}{" "}
                          •{" "}
                          {formatTime(
                            new Date(enrichedBooking.booking.dateTime).toTimeString().substring(0, 5),
                          )}
                        </span>
                        <span className="players-count-simple">
                          {enrichedBooking.players.length}/
                          {enrichedBooking.maxPlayers}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </div>
              <h4 className="empty-title">Δεν υπάρχουν διαθέσιμες κρατήσεις</h4>
              <p className="empty-description">
                Δοκιμάστε να προσαρμόσετε τα φίλτρα σας ή ελέγξτε ξανά αργότερα για νέες κρατήσεις.
              </p>
              <button className="btn btn-primary" onClick={clearFilters}>
                Καθαρισμός Φίλτρων
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {paginatedResponse && paginatedResponse.totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                <span>
                  Εμφάνιση {paginatedResponse.numberOfElements} από{" "}
                  {paginatedResponse.totalElements} κρατήσεις
                </span>
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(0)}
                  disabled={paginatedResponse.first}
                >
                  Πρώτη
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(paginatedResponse.number - 1)}
                  disabled={paginatedResponse.first}
                >
                  Προηγούμενη
                </button>

                {/* Page Numbers */}
                <div className="page-numbers">
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
                          className={`page-number ${paginatedResponse.number === pageNum ? "active" : ""}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    },
                  )}
                </div>

                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(paginatedResponse.number + 1)}
                  disabled={paginatedResponse.last}
                >
                  Επόμενη
                </button>
                <button
                  className="pagination-btn"
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
        </div>
      </div>

      {/* Join Booking Modal */}
      {selectedBooking && (
        <JoinBookingModal
          bookingReq={selectedBooking}
          isOpen={showJoinModal}
          onClose={handleCloseJoinModal}
          onSuccess={handleJoinSuccess}
        />
      )}

      {/* Message Modal */}
      <MessageModal
        isOpen={showMessageModal}
        type={messageType}
        title={messageTitle}
        message={messageText}
        onClose={handleCloseMessageModal}
        confirmText="Τέλεια!"
      />
    </UserLayout>
  );
};

export default FindBookings;
