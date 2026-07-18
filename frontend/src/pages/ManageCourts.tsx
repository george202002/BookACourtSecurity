import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AddCourt from "../components/AddCourt";
import EditCourt from "../components/EditCourt";
import ConfirmationModal from "../components/ConfirmationModal";
import MessageModal from "../components/MessageModal";
import AdminLayout from "../components/AdminLayout";
import LoadingSkeleton from "../components/LoadingSkeleton";
import {
  getCourts,
  createCourt,
  updateCourt,
  deleteCourt,
} from "../services/CourtsService";
import type { Court, CourtResponse } from "../dtos/Court";
import type { PaginatedCourtsResponse } from "../services/CourtsService";
import {
  COURT_TYPES_GREEK,
  COURT_ENVIRONMENT_GREEK,
  getCitiesForDropdown,
  GREEK_CITY_DISPLAY_NAMES,
  type CourtEnvironment,
  type CourtType,
} from "../enums/CourtEnums";
import type { FilterCriteria } from "../dtos/FilterCriteria";

const ManageCourts = () => {
  const navigate = useNavigate();
  const [paginatedResponse, setPaginatedResponse] =
    useState<PaginatedCourtsResponse | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [courtToDelete, setCourtToDelete] = useState<CourtResponse | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Success message modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Filter states
  const [filters, setFilters] = useState<FilterCriteria>({
    admin: true,
  });


  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(6); // Default 6 courts per page (2 per row × 3 rows)

  // Load courts on component mount
  useEffect(() => {
    loadCourts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load courts when pagination changes
  useEffect(() => {
    loadCourts();
  }, [currentPage, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCourts = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiFilters: FilterCriteria = {
        page: currentPage,
        size: pageSize,
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
      if (filters.minPrice && !isNaN(parseFloat(filters.minPrice.toString()))) {
        apiFilters.minPrice = parseFloat(filters.minPrice.toString());
      }
      if (filters.maxPrice && !isNaN(parseFloat(filters.maxPrice.toString()))) {
        apiFilters.maxPrice = parseFloat(filters.maxPrice.toString());
      }

      const response = await getCourts(navigate, apiFilters);
      setPaginatedResponse(response);
    } catch (err) {
      setError("Αποτυχία φόρτωσης γηπέδων. Παρακαλώ δοκιμάστε ξανά.");
      console.error("Error loading courts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourt = async (
    court: Omit<Court["court"], "id">,
    availability: Court["availability"],
  ) => {
    try {
      setError(null);

      const newCourtData = {
        court,
        availability,
      };

      await createCourt(newCourtData, navigate);
      setShowAddForm(false);
      // Reload courts from server
      await loadCourts();
    } catch (err) {
      setError("Αποτυχία προσθήκης γηπέδου. Παρακαλώ δοκιμάστε ξανά.");
      console.error("Error adding court:", err);
    }
  };

  const handleUpdateCourt = async (updatedCourt: Court) => {
    try {
      setError(null);

      await updateCourt(updatedCourt.court.id, updatedCourt, navigate);
      setEditingCourt(null);
      // Reload courts from server
      await loadCourts();
    } catch (err) {
      setError("Αποτυχία ενημέρωσης γηπέδου. Παρακαλώ δοκιμάστε ξανά.");
      console.error("Error updating court:", err);
    }
  };

  const handleDeleteCourt = (court: CourtResponse) => {
    setCourtToDelete(court);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteCourt = async () => {
    if (!courtToDelete) return;

    try {
      setDeleteLoading(true);
      setError(null);

      await deleteCourt(courtToDelete.id, navigate);

      // Show success message
      const courtName = courtToDelete.name;
      const cityName = courtToDelete.city ? GREEK_CITY_DISPLAY_NAMES[courtToDelete.city] : "Άγνωστη πόλη";
      setSuccessMessage(
        `Το γήπεδο "${courtName}" στην ${cityName} διαγράφηκε επιτυχώς.`
      );
      setShowSuccessModal(true);

      setShowDeleteConfirmation(false);
      setCourtToDelete(null);
      // Reload courts from server
      await loadCourts();
    } catch (err) {
      setError("Αποτυχία διαγραφής γηπέδου. Παρακαλώ δοκιμάστε ξανά.");
      console.error("Error deleting court:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDeleteCourt = () => {
    setShowDeleteConfirmation(false);
    setCourtToDelete(null);
    setDeleteLoading(false);
  };

  const toggleCourtStatus = async (id: number) => {
    try {
      setError(null);
      const court = paginatedResponse?.content.find((c) => c.id === id);
      if (!court) return;

      // Update only the active status
      const courtForUpdate: Partial<Court> = {
        court: {
          id: court.id,
          name: court.name,
          city: court.city,
          address: court.address,
          mapsLink: court.mapsLink,
          price: court.price,
          description: court.description,
          active: !court.active, // Toggle the active status
          courtType: court.courtType,
          environment: court.environment,
          slotDuration: court.slotDuration,
        },
        availability: court.availability,
      };

      await updateCourt(id, courtForUpdate, navigate);

      // Reload courts from server
      await loadCourts();
    } catch (err) {
      setError("Αποτυχία ενημέρωσης κατάστασης γηπέδου. Παρακαλώ δοκιμάστε ξανά.");
      console.error("Error updating court status:", err);
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

  // Filter helper functions
  const handleFilterChange = (
    key: keyof FilterCriteria,
    value: string | number | undefined,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      city: "",
      courtType: "" as CourtType,
      environment: "" as CourtEnvironment,
      minPrice: undefined,
      maxPrice: undefined,
      admin: true,
    });
    setCurrentPage(0); // Reset to first page
    // Auto-search after clearing filters
    setTimeout(() => {
      loadCourts();
    }, 0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0); // Reset to first page when changing page size
  };

  // Get all courts without status filtering
  const getFilteredCourts = () => {
    if (!paginatedResponse) return [];
    return paginatedResponse.content;
  };

  const getGreekDayName = (day: string): string => {
    const dayNames: { [key: string]: string } = {
      monday: "Δευτέρα",
      tuesday: "Τρίτη",
      wednesday: "Τετάρτη",
      thursday: "Πέμπτη",
      friday: "Παρασκευή",
      saturday: "Σάββατο",
      sunday: "Κυριακή",
    };
    return dayNames[day] || day;
  };

  return (
    <AdminLayout>
      <div className="manage-courts-container">
        <div className="courts-header">
          <div className="header-content">
            <h1 className="page-title">Διαχείριση Γηπέδων</h1>
            <p className="page-subtitle">
              Διαχειριστείτε τα γήπεδά σας, τιμές και διαθεσιμότητα
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
            disabled={loading}
          >
            Προσθηκη Νεου Γηπεδου
          </button>
        </div>

        {/* Court Statistics */}
        <div className="courts-stats">
          <div className="stat-item">
            <div className="stat-value">
              {paginatedResponse?.totalElements || 0}
            </div>
            <div className="stat-label">Συνολο Γηπεδων</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {paginatedResponse?.content.filter((c) => c.active).length || 0}
            </div>
            <div className="stat-label">Ενεργα Γηπεδα</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              €{paginatedResponse?.content.length
                ? Math.round(
                    paginatedResponse.content.reduce(
                      (sum, c) => sum + c.price,
                      0,
                    ) / paginatedResponse.content.length,
                  )
                : 0}
            </div>
            <div className="stat-label">Μεση Τιμη/Κρατηση</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{getFilteredCourts().length}</div>
            <div className="stat-label">Φιλτραρισμενα Αποτελεσματα</div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="admin-filters-card">
          <div className="filters-header">
            <div className="filters-title">
              <h3>Φίλτρα Γηπέδων</h3>
              <p>Βρείτε και διαχειριστείτε γήπεδα</p>
            </div>
            <div className="filter-actions">
              <button className="btn btn-secondary" onClick={clearFilters}>
                Καθαρισμος
              </button>
              <button className="btn btn-primary" onClick={handleSearch}>
                Αναζητηση
              </button>
            </div>
          </div>
          <div className="admin-filters-grid">
            {/* Search */}
            <div className="admin-filter-group">
              <label className="admin-filter-label">Αναζητηση</label>
              <input
                type="text"
                className="admin-filter-input"
                placeholder="Αναζήτηση ονόματος..."
                value={filters.searchTerm || ""}
                onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* City */}
            <div className="admin-filter-group">
              <label className="admin-filter-label">Πολη</label>
              <select
                className="admin-filter-select"
                value={filters.city || ""}
                onChange={(e) => handleFilterChange("city", e.target.value)}
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
                onChange={(e) => handleFilterChange("courtType", e.target.value)}
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
              <label className="admin-filter-label">Χωρος</label>
              <select
                className="admin-filter-select"
                value={filters.environment || ""}
                onChange={(e) => handleFilterChange("environment", e.target.value)}
              >
                <option value="">Εσωτερικός & Εξωτερικός</option>
                {Object.entries(COURT_ENVIRONMENT_GREEK).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="admin-filter-group price-range-group">
              <label className="admin-filter-label">Ευρος Τιμης (€)</label>
              <div className="admin-price-range-inputs">
                <input
                  type="number"
                  className="admin-filter-input price-input"
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="Ελάχ €"
                  value={filters.minPrice || ""}
                  onChange={(e) =>
                    handleFilterChange("minPrice", e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                />
                <span className="price-separator">-</span>
                <input
                  type="number"
                  className="admin-filter-input price-input"
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="Μέγ €"
                  value={filters.maxPrice || ""}
                  onChange={(e) =>
                    handleFilterChange("maxPrice", e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Add Court Form Component */}
        <AddCourt
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onAddCourt={handleAddCourt}
          existingCourts={paginatedResponse?.content || []}
        />

        {/* Edit Court Form Component */}
        <EditCourt
          court={editingCourt}
          isOpen={!!editingCourt}
          onClose={() => setEditingCourt(null)}
          onUpdateCourt={handleUpdateCourt}
          existingCourts={paginatedResponse?.content || []}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteConfirmation}
          onClose={cancelDeleteCourt}
          onConfirm={confirmDeleteCourt}
          title="Διαγραφή Γηπέδου"
          message={`Είστε σίγουροι ότι θέλετε να διαγράψετε το "${courtToDelete?.name}"; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί και θα αφαιρέσει όλες τις σχετικές κρατήσεις.`}
          confirmText="Διαγραφή Γηπέδου"
          cancelText="Ακύρωση"
          type="danger"
          isLoading={deleteLoading}
        />

        {/* Success Message Modal */}
        <MessageModal
          isOpen={showSuccessModal}
          type="success"
          title="Το Γήπεδο Διαγράφηκε Επιτυχώς"
          message={successMessage}
          onClose={() => setShowSuccessModal(false)}
        />

        {error && <span className="error-message">{error}</span>}

        {/* Results Summary */}
        {paginatedResponse && (
          <div className="results-summary">
            <div className="results-info">
              <h3>Αποτελέσματα Γηπέδων</h3>
              <p>
                Φαίνονται {getFilteredCourts().length} από{" "}
                {paginatedResponse.totalElements} γήπεδα

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
                  <option value={4}>2 γραμμές (4 γήπεδα)</option>
                  <option value={6}>3 γραμμές (6 γήπεδα)</option>
                  <option value={8}>4 γραμμές (8 γήπεδα)</option>
                  <option value={10}>5 γραμμές (10 γήπεδα)</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Courts List */}
        <div className="courts-grid">
          {loading && !paginatedResponse ? (
            <LoadingSkeleton variant="courts" count={6} />
          ) : getFilteredCourts().map((court) => (
            <div
              key={court.id}
              className={`court-card ${!court.active ? "inactive" : ""}`}
            >
              <div className="court-header">
                <div className="court-info">
                  <h3 className="court-name">{court.name}</h3>
                  <div className="court-type-badge">{COURT_TYPES_GREEK[court.courtType]}</div>
                  <p className="court-location">
                    {court.city ? GREEK_CITY_DISPLAY_NAMES[court.city] : "Άγνωστο"} • {COURT_ENVIRONMENT_GREEK[court.environment]}
                  </p>
                  <p className="court-address">{court.address}</p>
                </div>
                <div className="court-actions">
                  <button
                    className={`status-toggle ${court.active ? "active" : "inactive"}`}
                    onClick={() => toggleCourtStatus(court.id)}
                    disabled={loading}
                  >
                    {court.active ? "Ενεργο" : "Ανενεργο"}
                  </button>
                  <button
                    className="edit-button"
                    onClick={() => {
                      // Convert CourtResponse to Court format for editing
                      const courtForEdit: Court = {
                        court: {
                          id: court.id,
                          name: court.name,
                          city: court.city,
                          address: court.address,
                          mapsLink: court.mapsLink,
                          price: court.price,
                          description: court.description,
                          active: court.active,
                          courtType: court.courtType,
                          environment: court.environment,
                          slotDuration: court.slotDuration,
                        },
                        availability: court.availability,
                      };
                      setEditingCourt(courtForEdit);
                    }}
                    disabled={loading}
                  >
                    Επεξεργασια
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteCourt(court)}
                    disabled={loading}
                  >
                    Διαγραφη
                  </button>
                </div>
              </div>

              <div className="court-details">
                <div className="court-price">
                  <span className="price-label">Τιμη ανα Κρατηση ({court.slotDuration}h)</span>
                  <span className="price-value">€{court.price}</span>
                </div>

                {court.mapsLink && (
                  <div className="court-maps">
                    <a
                      href={court.mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="maps-link"
                    >
                      Προβολή στον Χάρτη
                    </a>
                  </div>
                )}

                <div className="court-description">
                  <p>{court.description}</p>
                </div>
              </div>

              <div className="availability-section">
                <h4 className="availability-title">Εβδομαδιαία Διαθεσιμότητα</h4>
                <div className="availability-grid">
                  {Object.entries(court.availability).map(([day, schedule]) => {
                    const dayName = getGreekDayName(day);
                    const formattedDay =
                      dayName.charAt(0).toUpperCase() + dayName.slice(1);

                    return (
                      <div key={day} className="day-schedule">
                        <div className="day-name">{formattedDay}</div>
                        <div className="schedule-display">
                          {schedule.available && schedule.periods.length > 0 ? (
                            <>
                              <span className="availability-status open">Ανοιχτά</span>
                              <div className="time-display">
                                {schedule.periods.map((period, index) => (
                                  <span key={index} className="time-range">
                                    {period.startTime} - {period.endTime}
                                  </span>
                                ))}
                              </div>
                            </>
                          ) : (
                            <span className="availability-status closed">Κλειστά</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {paginatedResponse && paginatedResponse.totalPages > 1 && (
          <div className="admin-pagination-container">
            <div className="admin-pagination-info">
              <span>
                Φαίνονται {paginatedResponse.numberOfElements} από{" "}
                {paginatedResponse.totalElements} γήπεδα
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
          !loading &&
          !error && (
            <div className="empty-state">
              <div className="empty-icon">🏟️</div>
              <h3 className="empty-title">
                {filters.searchTerm ||
                filters.city ||
                filters.courtType ||
                filters.environment ||
                filters.minPrice ||
                filters.maxPrice
                  ? "Δεν Βρέθηκαν Γήπεδα"
                  : "Δεν Προστέθηκαν Γήπεδα Ακόμα"}
              </h3>
              <p className="empty-description">
                {filters.searchTerm ||
                filters.city ||
                filters.courtType ||
                filters.environment ||
                filters.minPrice ||
                filters.maxPrice
                  ? "Δοκιμάστε να προσαρμόσετε τα φίλτρα για να βρείτε περισσότερα γήπεδα."
                  : "Προσθέστε το πρώτο σας γήπεδο για να ξεκινήσετε τη διαχείριση κρατήσεων και διαθεσιμότητας."}
              </p>
              {filters.searchTerm ||
              filters.city ||
              filters.courtType ||
              filters.environment ||
              filters.minPrice ||
              filters.maxPrice ? (
                <button className="btn btn-primary" onClick={clearFilters}>
                  Καθαρισμός Φίλτρων
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddForm(true)}
                  disabled={loading}
                >
                  Προσθήκη Πρώτου Γηπέδου
                </button>
              )}
            </div>
          )}
      </div>
    </AdminLayout>
  );
};

export default ManageCourts;
