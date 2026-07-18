import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { CourtResponse } from "../dtos/Court";
import type {
  BookingRequest,
  Players,
} from "../dtos/Booking";
import { createBooking, getBookingsByDate } from "../services/BookingsService";
import { generateTimeSlots, formatTimeDisplay, type TimeSlot } from "../utils/TimeSlotUtils";
import { formatDateFromForZonedDateTime, getMinBookingDate, getMaxBookingDate } from "../utils/DateUtils";
import {
  createCheckoutSession,
  redirectToStripeCheckout,
} from "../services/PaymentService";
import { GREEK_CITY_DISPLAY_NAMES } from "../enums/CourtEnums";
import TokenUtils from "../utils/TokenUtils";
import type { User } from "../dtos/User";
interface UserBookingModalProps {
  court: CourtResponse;
  isOpen: boolean;
  onClose: () => void;
}

const UserBookingModal: React.FC<UserBookingModalProps> = ({
  court,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [additionalPlayers, setAdditionalPlayers] = useState<Players[]>([]);

  // Set default date to today and load user info
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split("T")[0];
      setSelectedDate(today);
      setError(null);
      setSelectedTimeSlot(null);
      setAdditionalPlayers([]);
      loadCurrentUser();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Load time slots when date changes
  useEffect(() => {
    if (selectedDate && isOpen) {
      loadTimeSlots();
    }
  }, [selectedDate, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTimeSlots = async () => {
    try {
      setSlotsLoading(true);
      setError(null);

      // Get existing bookings for this date - format for backend API
      const formattedDate = formatDateFromForZonedDateTime(selectedDate);
      if (!formattedDate) {
        setError("Άκυρη ημερομηνία επιλογής.");
        return;
      }
      const existingBookings = await getBookingsByDate(court.id, formattedDate, navigate);

      // Generate time slots based on court configuration and existing bookings
      const slots = generateTimeSlots(court, selectedDate, existingBookings);
      setTimeSlots(slots);
      setSelectedTimeSlot(null);
    } catch (err) {
      setServerError("Αποτυχία φόρτωσης διαθέσιμων ωραρίων.");
      console.error("Error loading slots:", err);
    } finally {
      setSlotsLoading(false);
    }
  };

  const addPlayer = () => {
    const maxPlayers = court.courtType === "Padel" ? 4 : 10; // Padel max 4, others more flexible
    if (additionalPlayers.length < maxPlayers - 1) {
      // -1 because current user is always included
      setAdditionalPlayers([
        ...additionalPlayers,
        { playerName: "", playerPhone: "", playerEmail: "", addedBy: currentUser?.id || "" },
      ]);
    }
  };

  const removePlayer = (index: number) => {
    setAdditionalPlayers(additionalPlayers.filter((_, i) => i !== index));
  };

  const updatePlayer = (index: number, field: keyof Players, value: string) => {
    // Clear any previous phone validation errors when typing
    if (field === 'playerPhone' && error?.includes('phone number')) {
      setError(null);
    }

    const updatedPlayers = [...additionalPlayers];
    updatedPlayers[index] = { ...updatedPlayers[index], [field]: value };
    setAdditionalPlayers(updatedPlayers);
  };

  const getTotalPlayers = () => {
    return (
      1 +
      additionalPlayers.filter(
        (p) => p.playerName.trim() && p.playerPhone.trim(),
      ).length
    );
  };

  const getMaxPlayers = () => {
    switch (court.courtType) {
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
    // Always divide by maximum capacity, not actual players
    return court.price / getMaxPlayers();
  };

  const validateUniquePhoneNumbers = () => {
    const allPhones: string[] = [];

    // Add current user's phone
    if (currentUser?.phone) {
      allPhones.push(currentUser.phone.trim());
    }

    // Add additional players' phones
    additionalPlayers.forEach(player => {
      if (player.playerPhone?.trim()) {
        allPhones.push(player.playerPhone.trim());
      }
    });

    // Check for duplicates
    const phoneSet = new Set();
    for (const phone of allPhones) {
      if (phoneSet.has(phone)) {
        return `Ο αριθμός τηλεφώνου ${phone} χρησιμοποιείται ήδη από άλλο παίκτη`;
      }
      phoneSet.add(phone);
    }

    return null;
  };

  const getUserPayment = () => {
    return getTotalPlayers() * getPricePerPlayer();
  };

  const isFormValid = () => {
    const phoneError = validateUniquePhoneNumbers();
    if (phoneError) {
      setError(phoneError);
      return false;
    }

    // All additional players must have name >= 3 and valid phone
    const phoneRegex = /^\+?[\d\s\-()]{10}$/;
    const allPlayersValid = additionalPlayers.every(
      (player) =>
        player.playerName.trim().length >= 3 &&
        phoneRegex.test(player.playerPhone.trim())
    );

    if(!allPlayersValid) {
      setError("Τα ονόματα των παικτών πρέπει να έχουν τουλάχιστον 3 χαρακτήρες και τα τηλέφωνα να είναι έγκυρα.");
      return false;
    }

    return (
      selectedTimeSlot &&
      currentUser &&
      allPlayersValid
    );
  };

  const handleSubmit = async () => {
    if (!selectedTimeSlot || !currentUser) {
      setError("Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία.");
      return;
    }
    if (!isFormValid()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setServerError(null);

      // Create players array starting with current user
      const allPlayers: Players[] = [
        {
          playerName: `${currentUser.firstName} ${currentUser.lastName}`,
          playerPhone: currentUser.phone || "",
          playerEmail: currentUser.email,
          userId: currentUser.id,
          addedBy: currentUser.id,
        },
        // Add additional players that have been filled out
        ...additionalPlayers.filter(
          (player) => player.playerName.trim() && player.playerPhone.trim(),
        ),
      ];

      const userPayment = getUserPayment();
      const priceInCents = Math.round(userPayment * 100); // Convert to cents

      // Create dateTime from selected date and time slot
      const dateTime = `${selectedDate}T${selectedTimeSlot.startTime}:00`;

      const bookingRequest: BookingRequest = {
        booking: {
          id: "0",
          court: court,
          dateTime: dateTime,
          user: currentUser,
          status:
            getTotalPlayers() === getMaxPlayers() ? "FILLED" : "OPEN",
          notes: `Κράτηση χρήστη για ${court.name} - ${allPlayers.length} παίκτη(ς)`,
        },
        players: allPlayers,
      };

      // Save booking request to the backend
      const booking = await createBooking(bookingRequest, navigate);

      if (booking) {
        // Create Stripe checkout session
        const { sessionId } = await createCheckoutSession(
          {
            bookingId: booking.id,
            bookingStatus: bookingRequest.booking.status,
            priceInCents,
            userId: currentUser.id,
          },
          navigate
        );

        // Redirect to Stripe Checkout
        redirectToStripeCheckout(sessionId);
      } else {
        throw new Error("Αποτυχία αποθήκευσης αιτήματος κράτησης.");
      }
      // Note: We don't call onSuccess() here since payment needs to complete first
      // The success will be handled by the PaymentSuccess page after Stripe redirect
    } catch (err) {
      setServerError("Αποτυχία πληρωμής. Παρακαλώ δοκιμάστε ξανά.");
      console.error("Error creating checkout session:", err);
      setLoading(false);
    }
    // Note: We don't set loading to false on success since user is redirected
  };

  const getMinDate = () => {
    return getMinBookingDate();
  };

  const getMaxDate = () => {
    return getMaxBookingDate();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay-custom position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      onClick={onClose}
      style={{ zIndex: 1050 }}
    >
      <div
        className="modal-container-custom card shadow-lg border-0"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "600px", width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
          <h5 className="mb-0 fw-bold">Κράτηση {court.name}</h5>
          <button className="btn-close" onClick={onClose} aria-label="Close" />
        </div>

        <div className="card-body overflow-auto" style={{ flex: 1 }}>
          {/* Court Info */}
          <div className="bg-light rounded-3 p-3 mb-4">
            <h6 className="fw-bold mb-1">{court.name}</h6>
            <p className="text-secondary mb-1 small">
              {court.city ? GREEK_CITY_DISPLAY_NAMES[court.city] : "Άγνωστο"} • {court.address}
            </p>
            <p className="fw-bold text-primary mb-0">€{court.price}/ώρα</p>
          </div>

          {/* Date Selection */}
          <div className="mb-4">
            <label className="form-label fw-semibold">Επιλογη Ημερομηνιας</label>
            <input
              type="date"
              className="form-control"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getMinDate()}
              max={getMaxDate()}
            />
          </div>

          {/* Time Slots */}
          <div className="mb-4">
            <label className="form-label fw-semibold">Διαθεσιμα Ωραρια</label>
            {slotsLoading ? (
              <div className="text-center text-secondary py-3">Φόρτωση διαθέσιμων ωρών...</div>
            ) : timeSlots.length > 0 ? (
              <div className="time-slots-grid">
                {timeSlots.map((slot, index) => (
                  <button
                    key={index}
                    className={`time-slot ${selectedTimeSlot?.startTime === slot.startTime ? "selected" : ""} ${!slot.available ? "unavailable" : ""}`}
                    onClick={() => slot.available && setSelectedTimeSlot(slot)}
                    disabled={!slot.available}
                  >
                    {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                    {!slot.available && (
                      <span className="d-block small opacity-75">
                        {slot.unavailableReason === 'past' ? 'Περασμένο' : 'Κλεισμένο'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="alert alert-warning mb-0">
                Δεν υπάρχουν διαθέσιμα ωράρια για αυτή την ημερομηνία. Παρακαλώ επιλέξτε άλλη
                ημερομηνία.
              </div>
            )}
          </div>

          {/* Players */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <label className="form-label fw-semibold mb-0">Παικτες & Κατανομη Πληρωμης</label>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary">
                  {getTotalPlayers()}/{getMaxPlayers()}
                </span>
                {additionalPlayers.length < getMaxPlayers() - 1 && (
                  <button className="btn btn-outline-primary btn-sm" onClick={addPlayer}>
                    + Προσθήκη
                  </button>
                )}
              </div>
            </div>

            {/* Current User (You) */}
            {currentUser && (
              <div className="card mb-3 border-primary">
                <div className="card-header bg-primary bg-opacity-10 d-flex justify-content-between align-items-center py-2">
                  <span className="fw-semibold small">Εσείς (Παίκτης 1)</span>
                  <span className="badge bg-success">€{getUserPayment().toFixed(2)}</span>
                </div>
                <div className="card-body p-3">
                  <div className="row g-2">
                    <div className="col-12">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={`${currentUser.firstName} ${currentUser.lastName}`}
                        disabled
                      />
                    </div>
                    <div className="col-6">
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        value={currentUser.phone || ""}
                        disabled
                      />
                    </div>
                    <div className="col-6">
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        value={currentUser.email}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Players */}
            {additionalPlayers.map((player, index) => (
              <div key={index} className="card mb-3">
                <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                  <span className="fw-semibold small">Παίκτης {index + 2}</span>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-secondary">€{getPricePerPlayer().toFixed(2)}</span>
                    <button
                      className="btn btn-outline-danger btn-sm py-0 px-2"
                      onClick={() => removePlayer(index)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="card-body p-3">
                  <div className="row g-2">
                    <div className="col-12">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Πλήρες Όνομα *"
                        value={player.playerName}
                        onChange={(e) =>
                          updatePlayer(index, "playerName", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-6">
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        placeholder="Τηλέφωνο *"
                        value={player.playerPhone}
                        onChange={(e) =>
                          updatePlayer(index, "playerPhone", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-6">
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        placeholder="Email (Προαιρετικό)"
                        value={player.playerEmail}
                        onChange={(e) =>
                          updatePlayer(index, "playerEmail", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pricing explanation for all court types */}
            <div className="alert alert-info mb-0">
              <h6 className="alert-heading mb-2">Πληροφορίες Τιμών</h6>
              <p className="mb-0 small">
                Γήπεδα <strong>{court.courtType}</strong> υποστηρίζουν μέχρι{" "}
                {getMaxPlayers()} παίκτες. Κάθε παίκτης πληρώνει:{" "}
                <strong>€{getPricePerPlayer().toFixed(2)}</strong>
              </p>
              {getTotalPlayers() < getMaxPlayers() && (
                <p className="mb-0 mt-2 small text-secondary">
                  {getMaxPlayers() - getTotalPlayers()} θέσεις διαθέσιμες για
                  άλλους παίκτες να συμμετέχουν
                </p>
              )}
              {getTotalPlayers() === getMaxPlayers() && (
                <p className="mb-0 mt-2 small text-success fw-semibold">
                  Το γήπεδο είναι πλήρως κλεισμένο! Συνολικό κόστος: €{court.price.toFixed(2)}
                </p>
              )}
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {/* Summary */}
          {selectedTimeSlot && (
            <div className="card bg-light border-0">
              <div className="card-header bg-primary text-white py-2">
                <h6 className="mb-0 fw-bold">Περίληψη Κράτησης & Πληρωμή</h6>
              </div>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-secondary small">Γήπεδο:</span>
                  <span className="fw-medium small">{court.name}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-secondary small">Ημερομηνία:</span>
                  <span className="fw-medium small">{new Date(selectedDate).toLocaleDateString("el-GR")}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-secondary small">Ώρα:</span>
                  <span className="fw-medium small">
                    {formatTimeDisplay(selectedTimeSlot.startTime)} -{" "}
                    {formatTimeDisplay(selectedTimeSlot.endTime)}
                  </span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-secondary small">Παίκτες:</span>
                  <span className="fw-medium small">{getTotalPlayers()}/{getMaxPlayers()}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-secondary small">Τιμή Γηπέδου:</span>
                  <span className="fw-medium small">€{court.price.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-secondary small">Τιμή/Παίκτη:</span>
                  <span className="fw-medium small">€{getPricePerPlayer().toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between py-2 bg-success bg-opacity-10 rounded mt-2 px-2">
                  <span className="fw-bold">Η Πληρωμή Σας:</span>
                  <span className="fw-bold text-success">€{getUserPayment().toFixed(2)}</span>
                </div>
                {getTotalPlayers() < getMaxPlayers() && (
                  <div className="alert alert-warning mt-3 mb-0 py-2 small">
                    <p className="mb-1">
                      Μερική κράτηση - άλλοι παίκτες μπορούν να συμμετέχουν αργότερα και να πληρώσουν
                      το μερίδιό τους €{getPricePerPlayer().toFixed(2)}.
                    </p>
                    <p className="mb-0">
                      Αν η κράτηση δεν συμπληρωθεί 1 ώρα πριν από την ώρα έναρξης, θα ακυρωθεί
                      και θα λάβετε επιστροφή χρημάτων.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          {serverError && <div className="alert alert-danger mt-3">{serverError}</div>}
        </div>

        <div className="card-footer bg-white border-top d-flex justify-content-end gap-2 py-3">
          <button
            className="btn btn-outline-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Ακυρωση
          </button>
          <button
            className={`btn btn-primary ${loading ? "btn-loading" : ""}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Επεξεργασία..." : "Συνεχεια στην Πληρωμη"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserBookingModal;
