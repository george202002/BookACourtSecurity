import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import UserBookingModal from "../components/UserBookingModal";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { getCourts } from "../services/CourtsService";
import type { CourtResponse } from "../dtos/Court";
import type { PaginatedCourtsResponse } from "../services/CourtsService";
import {
  getCitiesForDropdown,
  GREEK_CITY_DISPLAY_NAMES,
  type GreekCity,
  type CourtEnvironment,
  type CourtType,
  COURT_TYPES_GREEK,
  COURT_ENVIRONMENT_GREEK,
} from "../enums/CourtEnums";
import type { FilterCriteria } from "../dtos/FilterCriteria";

const FindCourts = () => {
  const navigate = useNavigate();
  const [paginatedResponse, setPaginatedResponse] =
    useState<PaginatedCourtsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  const [selectedCity, setSelectedCity] = useState<GreekCity | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<CourtType | undefined>(undefined);
  const [selectedEnvironment, setSelectedEnvironment] = useState<CourtEnvironment | undefined>(undefined);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(6); // Default 6 courts per page (2 per row × 3 rows)

  // Booking modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<CourtResponse | null>(
    null,
  );

  // Load courts on mount
  useEffect(() => {
    loadCourts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load courts when pagination changes
  useEffect(() => {
    loadCourts();
  }, [currentPage, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear price range when court type changes
  useEffect(() => {
    if (selectedType) {
      // Clear price range when switching court types as calculations differ
      setPriceRange({ min: "", max: "" });
    }
  }, [selectedType]);

  const loadCourts = async () => {
    try {
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

      const response = await getCourts(navigate, filters);
      setPaginatedResponse(response);
    } catch (err) {
      setError("Απέτυχε η φόρτωση των γηπέδων. Παρακαλώ δοκιμάστε ξανά.");
      console.error("Error loading courts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(0); // Reset to first page when searching
    loadCourts();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearFilters = async () => {
    setSearchTerm("");
    setSelectedCity(undefined);
    setSelectedType(undefined);
    setSelectedEnvironment(undefined);
    setPriceRange({ min: "", max: "" });
    setCurrentPage(0); // Reset to first page

    // Load courts with empty filters immediately
    try {
      setLoading(true);
      setError(null);

      const filters: FilterCriteria = {
        page: 0, // Use 0 since we just reset currentPage
        size: pageSize,
        admin: false,
      };

      const response = await getCourts(navigate, filters);
      setPaginatedResponse(response);
    } catch (err) {
      setError("Απέτυχε η φόρτωση των γηπέδων. Παρακαλώ δοκιμάστε ξανά.");
      console.error("Error loading courts:", err);
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

  const handleBookCourt = (court: CourtResponse) => {
    setSelectedCourt(court);
    setShowBookingModal(true);
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedCourt(null);
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

  const getPricePerPlayer = (court: CourtResponse) => {
    return court.price / getMaxPlayersForCourt(court.courtType);
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

  if (loading) {
    return (
      <UserLayout>
        <div className="page-header">
          <h1 className="page-title">Βρείτε το Ιδανικό σας Γήπεδο</h1>
          <p className="page-subtitle">
            Ανακαλύψτε υπέροχα γήπεδα και κλείστε το επόμενο παιχνίδι σας!
          </p>
        </div>
        <LoadingSkeleton variant="filters" />
        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <div className="skeleton skeleton-title" style={{ width: '180px', height: '24px' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '150px', height: '16px', marginTop: '8px' }}></div>
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
          <h1 className="page-title">Βρείτε το Ιδανικό σας Γήπεδο</h1>
          <p className="page-subtitle">
            Ανακαλύψτε υπέροχα γήπεδα και κλείστε το επόμενο παιχνίδι σας!
          </p>
        </div>
        <div className="dashboard-card">
          <div className="card-content">
            <div className="empty-state">
              <div className="empty-icon">Σφάλμα</div>
              <h4 className="empty-title">Σφάλμα φόρτωσης γηπέδων</h4>
              <p className="empty-description">{error}</p>
              <button className="btn btn-primary" onClick={loadCourts}>
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
        <h1 className="page-title">Βρείτε το Ιδανικό σας Γήπεδο</h1>
        <p className="page-subtitle">
          Ανακαλύψτε γήπεδα και κλείστε το επόμενο παιχνίδι σας!
        </p>
      </div>

      {/* Filters Section */}
      <div className="dashboard-card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Φίλτρα Γηπέδων</h3>
            <p className="card-subtitle">
              Βρείτε το ιδανικό γήπεδο για τις ανάγκες σας
            </p>
          </div>
          <div className="filter-actions">
            <button className="btn btn-secondary" onClick={clearFilters}>
              Καθαρισμός
            </button>
            <button className="btn btn-primary" onClick={handleSearch}>
              Αναζήτηση
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
              <label className="filter-label">Χωρος</label>
              <select
                className="filter-select"
                value={selectedEnvironment}
                onChange={(e) => setSelectedEnvironment(e.target.value as CourtEnvironment)}
              >
                <option value="">Εσωτερικος & Εξωτερικος</option>
                {Object.entries(COURT_ENVIRONMENT_GREEK).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="filter-group">
              <label className="filter-label">Ευρος Τιμης (ανα παικτη)</label>
              {!selectedType && (
                <p className="filter-info-text">
                  Επιλεξτε ένα άθλημα για να ορίσετε τιμές
                </p>
              )}
              <div className="price-range-inputs">
                <input
                  type="number"
                  className={`filter-input price-input ${!selectedType ? "disabled" : ""}`}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="Ελαχ €"
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
                  placeholder="Μεγ €"
                  value={priceRange.max}
                  disabled={!selectedType}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, max: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="dashboard-card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Διαθέσιμα Γήπεδα</h3>
            <p className="card-subtitle">
              {paginatedResponse
                ? `${paginatedResponse.totalElements} ${paginatedResponse.totalElements !== 1 ? "γήπεδα βρέθηκαν" : "γήπεδο βρέθηκε"}`
                : "Φόρτωση γηπέδων..."}
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
                <option value={4}>2 γραμμές (4 γήπεδα)</option>
                <option value={6}>3 γραμμές (6 γήπεδα)</option>
                <option value={8}>4 γραμμές (8 γήπεδα)</option>
                <option value={10}>5 γραμμές (10 γήπεδα)</option>
              </select>
            </div>
          )}
        </div>
        <div className="card-content">
          {paginatedResponse && paginatedResponse.content.length > 0 ? (
            <div className="courts-grid">
              {paginatedResponse.content.map((court) => {
                const maxPlayers = getMaxPlayersForCourt(court.courtType);
                return (
                  <div
                    key={court.id}
                    className="court-card-visual"
                    style={{
                      background: getCourtBackgroundFallback(court.courtType),
                      backgroundImage: `url(${getCourtBackgroundImage(court.courtType)})`,
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
                          {court.name}
                        </h4>
                        <div className="price-simple">
                          €{getPricePerPlayer(court).toFixed(2)}/παίκτη
                        </div>
                      </div>

                      {/* All Available Spots for New Booking */}
                      <div className="players-on-court">
                        {Array.from({ length: maxPlayers }, (_, index) => (
                          <div
                            key={`spot-${index}`}
                            className="available-spot-simple"
                            style={{
                              left: `${getPlayerPosition(index, court.courtType).x}%`,
                              top: `${getPlayerPosition(index, court.courtType).y}%`,
                            }}
                            onClick={() => handleBookCourt(court)}
                            title="Κάντε κλικ για κράτηση"
                          >
                            <div className="join-circle-simple">+</div>
                          </div>
                        ))}
                      </div>

                      {/* Simple Footer */}
                      <div className="court-footer-simple">
                        <span className="court-info-simple">
                          {court.city ? GREEK_CITY_DISPLAY_NAMES[court.city] : "Αγνωστο"} • {COURT_TYPES_GREEK[court.courtType]}
                        </span>
                        <span className="players-count-simple">
                          0/{maxPlayers}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">Αναζήτηση</div>
              <h4 className="empty-title">Δεν βρέθηκαν γήπεδα</h4>
              <p className="empty-description">
                Δοκιμάστε να προσαρμόσετε τα φίλτρα σας για να βρείτε περισσότερα γήπεδα.
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
                  Φαίνονται {paginatedResponse.numberOfElements} από{" "}
                  {paginatedResponse.totalElements} γήπεδα
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

      {/* Booking Modal */}
      {selectedCourt && (
        <UserBookingModal
          court={selectedCourt}
          isOpen={showBookingModal}
          onClose={handleCloseModal}
        />
      )}
    </UserLayout>
  );
};

export default FindCourts;
