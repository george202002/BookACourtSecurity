import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { CourtResponse } from "../dtos/Court";
import type {
  BookingRequest,
  Players,
} from "../dtos/Booking";
import { getBookingsByDate } from "../services/BookingsService";
import { generateTimeSlots, formatTimeDisplay, type TimeSlot } from "../utils/TimeSlotUtils";
import TokenUtils from "../utils/TokenUtils";
import { formatDateForDisplay, formatDateFromForZonedDateTime, getMinBookingDate, getMaxBookingDate } from "../utils/DateUtils";
import type { User } from "../dtos/User";

interface AddBookingProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBooking: (bookingRequest: BookingRequest) => void;
  courts: CourtResponse[];
}

const AddBooking: React.FC<AddBookingProps> = ({
  isOpen,
  onClose,
  onAddBooking,
  courts,
}) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<CourtResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [players, setPlayers] = useState<Omit<Players, "id">[]>([]);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Player form for adding individual players
  const [newPlayer, setNewPlayer] = useState<Omit<Players, "id">>({
    userId: "",
    playerName: "",
    playerPhone: "",
    playerEmail: "",
    addedBy: "",
  });

  // Load current user when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setSelectedTimeSlot(null);
      setPlayers([]);
      setNotes("");
      loadCurrentUser();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear phone errors when players list changes
  useEffect(() => {
    if (errors.players?.includes('phone number')) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { players: _, ...restErrors } = errors;
      setErrors(restErrors);
    }
  }, [players]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCurrentUser = async () => {
    try {
      const user = await TokenUtils.getUserFromToken(navigate);
      if (user) {
        setCurrentUser(user);
      }
    } catch (err) {
      console.error("Error loading user:", err);
    }
  };

  const resetForm = () => {
    setSelectedDate("");
    setSelectedTimeSlot(null);
    setSelectedCourt(null);
    setPlayers([]);
    setNotes("");
    setErrors({});
    setNewPlayer({
      userId: "",
      playerName: "",
      playerPhone: "",
      playerEmail: "",
      addedBy: "",
    });
  };

  // Fetch time slots based on court configuration and existing bookings
  const fetchTimeSlots = useCallback(async () => {
    if (!selectedCourt || !selectedDate) {
      setTimeSlots([]);
      return;
    }

    try {
      const date = formatDateFromForZonedDateTime(selectedDate);

      if (!date) {
        setErrors({ date: "Άκυρη ημερομηνία" });
        return;
      }
      // Get existing bookings for this date
      const existingBookings = await getBookingsByDate(selectedCourt.id, date, navigate);

      // Generate time slots based on court configuration and existing bookings
      const slots = generateTimeSlots(selectedCourt, selectedDate, existingBookings);
      setTimeSlots(slots);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      setTimeSlots([]);
    }
  }, [selectedCourt, selectedDate, navigate]);

  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  const handleCourtChange = (courtId: number) => {
    const court = courts.find((c) => c.id === courtId);
    if (court) {
      setSelectedCourt(court);
      setSelectedTimeSlot(null);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (!selectedCourt || !slot.available) return;
    setSelectedTimeSlot(slot);
  };

  const handleAddPlayer = () => {
    if (!newPlayer.playerName.trim() || !newPlayer.playerPhone.trim()) {
      setErrors({ players: "Απαιτείται όνομα και τηλέφωνο παίκτη" });
      return;
    }

    // Check for duplicate phone numbers
    const existingPhones = [
      ...players.map(p => p.playerPhone),
      ...(currentUser?.phone ? [currentUser.phone] : [])
    ];

    if (existingPhones.includes(newPlayer.playerPhone.trim())) {
      setErrors({ players: "Αυτός ο αριθμός τηλεφώνου χρησιμοποιείται ήδη από άλλο παίκτη" });
      return;
    }

    // All players must have name >= 3 and valid phone
    const phoneRegex = /^\+?[\d\s\-()]{10}$/;
    const playerValid = newPlayer.playerName.trim().length >= 3 &&
        phoneRegex.test(newPlayer.playerPhone.trim());

    if(!playerValid) {
      setErrors({ players: "Τα ονόματα των παικτών πρέπει να έχουν τουλάχιστον 3 χαρακτήρες και τα τηλέφωνα να είναι έγκυρα." });
      return false;
    }

    setPlayers([...players, newPlayer]);

    setNewPlayer({
      userId: "",
      playerName: "",
      playerPhone: "",
      playerEmail: "",
      addedBy: currentUser?.id || "", // Use admin user ID for addedBy
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { players: _, ...restErrors } = errors;
    setErrors(restErrors);
  };

  const handleRemovePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const isFormValid = () => {
    return (
      selectedTimeSlot &&
      selectedCourt &&
      currentUser &&
      players.length > 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTimeSlot || !isFormValid() || !currentUser || !selectedCourt) {
      setErrors({ general: "Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία και προσθέστε τουλάχιστον ένα παίκτη." });
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      // Create players array with all added players
      const allPlayers: Players[] = players.map(player => ({
        ...player,
        addedBy: currentUser.id,
      }));

      const totalPrice = getTotalPrice();
      const priceInCents = Math.round(totalPrice * 100); // Convert to cents

      const bookingRequest: BookingRequest = {
        booking: {
          id: "0",
          court: selectedCourt,
          dateTime: `${selectedDate}T${selectedTimeSlot.startTime}:00`,
          user: currentUser,
          status: players.length === getMaxPlayers() ? "FILLED" : "OPEN",
          notes: notes || `Κράτηση διαχειριστή για ${selectedCourt.name} - ${allPlayers.length} παίκτη(ς)`,
        },
        players: allPlayers,
        priceInCents,
      };

      onAddBooking(bookingRequest);
      resetForm();
      onClose();
    } catch (err) {
      setErrors({ server: "Αποτυχία δημιουργίας κράτησης. Παρακαλώ δοκιμάστε ξανά." });
      console.error("Error creating booking:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getMinDate = () => {
    return getMinBookingDate();
  };

  const getMaxDate = () => {
    return getMaxBookingDate();
  };

  const getMaxPlayers = () => {
    if (!selectedCourt) return 10; // Default
    switch (selectedCourt.courtType) {
      case "Padel":
        return 4;
      case "Tennis":
        return 2; // Singles
      case "Basketball":
        return 10; // 5v5
      case "Football":
        return 22; // 11v11
      default:
        return 10; // Default for other sports
    }
  };

  const getPricePerPlayer = () => {
    if (!selectedCourt) return 0;
    // Always divide by maximum capacity, not actual players
    return selectedCourt.price / getMaxPlayers();
  };

  const getTotalPrice = () => {
    return players.length * getPricePerPlayer();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay-custom position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ zIndex: 1050 }}
    >
      <div
        className="modal-container-custom card shadow-lg border-0"
        style={{ maxWidth: "700px", width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
          <h5 className="mb-0 fw-bold">Προσθήκη Νέας Κράτησης</h5>
          <button className="btn-close" onClick={handleClose} type="button" aria-label="Close" />
        </div>

        <form onSubmit={handleSubmit} className="d-flex flex-column" style={{ flex: 1, overflow: "hidden" }}>
          <div className="card-body overflow-auto" style={{ flex: 1 }}>
            {errors.general && (
              <div className="alert alert-danger">{errors.general}</div>
            )}

            <div className="mb-4">
              <h6 className="fw-bold mb-1">Στοιχεία Κράτησης</h6>
              <p className="text-secondary small mb-3">
                Επιλέξτε γήπεδο, ημερομηνία και ωράριο για την κράτηση
              </p>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Γηπεδο *</label>
                <select
                  className={`form-select ${errors.court ? "is-invalid" : ""}`}
                  value={selectedCourt?.id || ""}
                  onChange={(e) => {
                    handleCourtChange(Number(e.target.value));
                    if (errors.court) {
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      const { court: _, ...restErrors } = errors;
                      setErrors(restErrors);
                    }
                  }}
                  required
                >
                  <option value="">Επιλέξτε γήπεδο</option>
                  {courts
                    .filter((court) => court.active)
                    .map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name} - €{court.price}/κράτηση
                      </option>
                    ))}
                </select>
                {errors.court && (
                  <div className="invalid-feedback">{errors.court}</div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Ημερομηνια *</label>
                <input
                  type="date"
                  className={`form-control ${errors.date ? "is-invalid" : ""}`}
                  value={selectedDate}
                  min={getMinDate()}
                  max={getMaxDate()}
                  onChange={(e) => {
                    handleDateChange(e.target.value);
                    if (errors.date) {
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      const { date: _, ...restErrors } = errors;
                      setErrors(restErrors);
                    }
                  }}
                  required
                />
                {errors.date && (
                  <div className="invalid-feedback">{errors.date}</div>
                )}
              </div>
            </div>

            {selectedCourt && selectedDate && (
              <div className="mb-4">
                <h6 className="fw-bold mb-1">Διαθέσιμα Ωράρια</h6>
                <p className="text-secondary small mb-3">
                  Επιλέξτε ένα διαθέσιμο ωράριο για {selectedCourt.name} την{" "}
                  {formatDateForDisplay(selectedDate)}
                </p>

                {errors.slot && (
                  <div className="alert alert-danger py-2 small">{errors.slot}</div>
                )}

                {timeSlots.length > 0 ? (
                  <div className="time-slots-grid">
                    {timeSlots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`time-slot ${
                          selectedTimeSlot?.startTime === slot.startTime
                            ? "selected"
                            : ""
                        } ${!slot.available ? "unavailable" : ""}`}
                        onClick={() => handleTimeSlotSelect(slot)}
                        disabled={!slot.available}
                      >
                        <div className="fw-medium">
                          {formatTimeDisplay(slot.startTime)} -{" "}
                          {formatTimeDisplay(slot.endTime)}
                        </div>
                        <div className="small text-muted">€{selectedCourt.price}</div>
                        {!slot.available && (
                          <div className="small text-danger">
                            {slot.unavailableReason === 'past' ? 'Περασμένο' : 'Κλεισμένο'}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="alert alert-warning">
                    Δεν υπάρχουν διαθέσιμα ωράρια για αυτή την ημερομηνία. Το γήπεδο ίσως είναι
                    κλειστό ή πλήρως κλεισμένο.
                  </div>
                )}
              </div>
            )}

            <div className="mb-4">
              <h6 className="fw-bold mb-1">Παίκτες</h6>
              <p className="text-secondary small mb-3">
                Προσθέστε παίκτες σε αυτή την κράτηση (απαιτείται τουλάχιστον ένας παίκτης)
              </p>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <label className="form-label fw-semibold mb-0">Παικτες</label>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary">
                    {players.length}/{getMaxPlayers()}
                  </span>
                  {players.length < getMaxPlayers() && (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={handleAddPlayer}
                    >
                      + Προσθήκη
                    </button>
                  )}
                </div>
              </div>

              {/* Add Player Form */}
              <div className="card mb-3 border-dashed">
                <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                  <span className="fw-semibold small">Νέος Παίκτης</span>
                  <span className="badge bg-secondary">
                    {selectedCourt ? `€${getPricePerPlayer().toFixed(2)}` : 'Προσθήκη'}
                  </span>
                </div>
                <div className="card-body p-3">
                  <div className="row g-2">
                    <div className="col-12 col-md-4">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Πλήρες Όνομα *"
                        value={newPlayer.playerName}
                        onChange={(e) =>
                          setNewPlayer({ ...newPlayer, playerName: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-6 col-md-4">
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        placeholder="Τηλέφωνο *"
                        value={newPlayer.playerPhone}
                        onChange={(e) => {
                          setNewPlayer({
                            ...newPlayer,
                            playerPhone: e.target.value,
                          });
                          // Clear phone validation errors when typing
                          if (errors.players?.includes('phone number')) {
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const { players: _, ...restErrors } = errors;
                            setErrors(restErrors);
                          }
                        }}
                      />
                    </div>
                    <div className="col-6 col-md-4">
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        placeholder="Email (Προαιρετικό)"
                        value={newPlayer.playerEmail || ""}
                        onChange={(e) =>
                          setNewPlayer({
                            ...newPlayer,
                            playerEmail: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  {errors.players && (
                    <div className="alert alert-danger py-2 mt-2 mb-0 small">{errors.players}</div>
                  )}
                </div>
              </div>

              {/* Added Players */}
              {players.map((player, index) => (
                <div key={index} className="card mb-2">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                    <span className="fw-semibold small">Παίκτης {index + 1}</span>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-success">€{getPricePerPlayer().toFixed(2)}</span>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm py-0 px-2"
                        onClick={() => handleRemovePlayer(index)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="card-body p-3">
                    <div className="row g-2">
                      <div className="col-12 col-md-4">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={player.playerName}
                          disabled
                        />
                      </div>
                      <div className="col-6 col-md-4">
                        <input
                          type="tel"
                          className="form-control form-control-sm"
                          value={player.playerPhone}
                          disabled
                        />
                      </div>
                      <div className="col-6 col-md-4">
                        <input
                          type="email"
                          className="form-control form-control-sm"
                          value={player.playerEmail || ""}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedTimeSlot && players.length > 0 && (
              <div className="card bg-light border-0 mb-4">
                <div className="card-header bg-primary text-white py-2">
                  <h6 className="mb-0 fw-bold">Περίληψη Κράτησης</h6>
                </div>
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-secondary small">Γήπεδο:</span>
                    <span className="fw-medium small">{selectedCourt?.name}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-secondary small">Ημερομηνία:</span>
                    <span className="fw-medium small">{formatDateForDisplay(selectedDate)}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-secondary small">Ώρα:</span>
                    <span className="fw-medium small">
                      {formatTimeDisplay(selectedTimeSlot.startTime)} - {formatTimeDisplay(selectedTimeSlot.endTime)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-secondary small">Παίκτες:</span>
                    <span className="fw-medium small">{players.length}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2 bg-success bg-opacity-10 rounded mt-2 px-2">
                    <span className="fw-bold">Συνολική Τιμή:</span>
                    <span className="fw-bold text-success">€{getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label fw-semibold">Σημειωσεις</label>
              <textarea
                className="form-control"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Επιπλέον σημειώσεις για αυτή την κράτηση..."
                rows={3}
              />
            </div>

            {errors.server && (
              <div className="alert alert-danger">{errors.server}</div>
            )}
          </div>

          <div className="card-footer bg-white border-top d-flex justify-content-end gap-2 py-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Ακυρωση
            </button>
            <button
              type="submit"
              className={`btn btn-primary ${loading ? "btn-loading" : ""}`}
              disabled={loading}
            >
              {loading ? "Δημιουργία..." : "Προσθηκη Κρατησης"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBooking;
