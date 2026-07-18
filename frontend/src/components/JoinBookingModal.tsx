import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { BookingRequest, Players } from "../dtos/Booking";
import {
  createCheckoutSession,
  redirectToStripeCheckout,
} from "../services/PaymentService";
import { GREEK_CITY_DISPLAY_NAMES } from "../enums/CourtEnums";
import TokenUtils from "../utils/TokenUtils";
import type { User } from "../dtos/User";
import "../styles/JoinBookingModal.css";
import { joinBooking } from "../services/BookingsService";

interface JoinBookingModalProps {
  bookingReq: BookingRequest;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const JoinBookingModal: React.FC<JoinBookingModalProps> = ({
  bookingReq: bookingReq,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [additionalPlayers, setAdditionalPlayers] = useState<Players[]>([]);

  // Load user info when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
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

  const getMaxPlayersForCourt = (courtType: string) => {
    switch (courtType) {
      case "Padel":
        return 4;
      case "Basketball":
        return 10; // 5v5
      case "Football":
        return 22; // 11v11
      default:
        return 10;
    }
  };

  const getCourt = () => {
    return bookingReq.booking.court;
  };

  const getBookingDate = () => {
    return new Date(bookingReq.booking.dateTime).toISOString().split('T')[0];
  };

  const getBookingTime = () => {
    const bookingDateTime = new Date(bookingReq.booking.dateTime);
    const startTime = bookingDateTime.toTimeString().substring(0, 5); // HH:mm
    const court = getCourt();
    const endDateTime = new Date(bookingDateTime.getTime() + (court.slotDuration || 1.5) * 60 * 60 * 1000);
    const endTime = endDateTime.toTimeString().substring(0, 5); // HH:mm

    return { startTime, endTime };
  };

  const getMaxPlayers = () => {
    const court = getCourt();
    return getMaxPlayersForCourt(court.courtType);
  };

  const getCurrentPlayers = () => {
    return bookingReq.players.length;
  };

  const getAvailableSpots = () => {
    return getMaxPlayers() - getCurrentPlayers();
  };

  const getPricePerPlayer = () => {
    const court = getCourt();
    return court.price / getMaxPlayers();
  };

  const getTotalNewPlayers = () => {
    return (
      1 +
      additionalPlayers.filter(
        (p) => p.playerName.trim() && p.playerPhone.trim(),
      ).length
    );
  };

  const getTotalPayment = () => {
    return getTotalNewPlayers() * getPricePerPlayer();
  };

  const addPlayer = () => {
    const remainingSpots = getAvailableSpots() - 1; // -1 because current user is joining
    if (additionalPlayers.length < remainingSpots) {
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

  const validateUniquePhoneNumbers = () => {
    const allPhones: string[] = [];

    // Add current user's phone
    if (currentUser?.phone) {
      allPhones.push(currentUser.phone.trim());
    }

    // Add existing players' phones from the booking
    bookingReq.players.forEach(player => {
      if (player.playerPhone) {
        allPhones.push(player.playerPhone.trim());
      }
    });

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
      currentUser &&
      getTotalNewPlayers() <= getAvailableSpots() &&
      allPlayersValid
    );
  };

  const handleSubmit = async () => {
    const phoneError = validateUniquePhoneNumbers();
    if (phoneError) {
      setError(phoneError);
      return;
    }

    if (!currentUser) {
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
      const newPlayers: Players[] = [
        {
          playerName: `${currentUser.firstName} ${currentUser.lastName}`,
          playerPhone: currentUser.phone || "",
          playerEmail: currentUser.email,
          userId: currentUser.id, // Include user ID for current user
          addedBy: currentUser.id
        },
        // Add additional players that have been filled out
        ...additionalPlayers.filter(
          (player) => player.playerName.trim() && player.playerPhone.trim(),
        ),
      ];

      const totalPayment = getTotalPayment();
      const priceInCents = Math.round(totalPayment * 100); // Convert to cents

      // Create a booking request for joining (this will be used for payment)
      // The backend will handle the join logic after payment confirmation
      const joinBookingRequest: BookingRequest = {
        booking: {
          id: bookingReq.booking.id, // Include existing booking ID for join
          court: bookingReq.booking.court,
          dateTime: bookingReq.booking.dateTime,
          user: currentUser,
          status:
            bookingReq.players.length + newPlayers.length === getMaxPlayers()
              ? "FILLED"
              : "OPEN",
        },
        players: newPlayers, // Only the new players joining
      };

      // Save booking request to the backend
      const booking = await joinBooking(joinBookingRequest, navigate);

      if (booking) {
        // Create Stripe checkout session
        const { sessionId } = await createCheckoutSession(
          {
            bookingId: booking.id,
            bookingStatus: joinBookingRequest.booking.status,
            priceInCents,
            userId: currentUser.id,
          },
          navigate,
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
      console.error("Error creating checkout session for join:", err);
      setLoading(false);
    }
    // Note: We don't set loading to false on success since user is redirected
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
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
        style={{ maxWidth: '850px', width: '100%', maxHeight: '90vh', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center py-3">
          <h5 className="mb-0 fw-bold">Συμμετοχή σε Κράτηση</h5>
          <button className="btn-close btn-close-white" onClick={onClose} aria-label="Close" />
        </div>

        {/* Scrollable Content */}
        <div className="card-body overflow-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
          {/* Booking Info */}
          <div className="bg-light rounded-3 p-3 mb-4">
            <h6 className="fw-bold text-primary mb-2">{getCourt().name}</h6>
            <div className="d-flex flex-column gap-1 small text-secondary">
              <span>
                {getCourt().city
                  ? GREEK_CITY_DISPLAY_NAMES[getCourt().city as keyof typeof GREEK_CITY_DISPLAY_NAMES]
                  : "Άγνωστο"}{" "}
                • {getCourt().address}
              </span>
              <span>{formatDate(getBookingDate())}</span>
              <span>
                <strong>Ώρα:</strong> {formatTime(getBookingTime().startTime)} - {formatTime(getBookingTime().endTime)}
              </span>
              <span>
                <strong>Οργανωτής:</strong> {bookingReq.booking.user.firstName} {bookingReq.booking.user.lastName}
              </span>
            </div>
            {bookingReq.booking.notes && (
              <div className="mt-2 small">
                <strong>Σημειώσεις:</strong> {bookingReq.booking.notes}
              </div>
            )}
          </div>

          {/* Current Players */}
          <div className="mb-4">
            <h6 className="fw-bold mb-3">Τρέχοντες Παίκτες</h6>
            <div className="row g-2">
              {bookingReq.players.map((player, index) => (
                <div key={index} className="col-md-6 col-lg-4">
                  <div className="card h-100 border">
                    <div className="card-body py-2 px-3">
                      <div className="fw-semibold small">{player.playerName}</div>
                      <div className="text-muted small">{player.playerPhone}</div>
                    </div>
                  </div>
                </div>
              ))}
              {Array.from({ length: getAvailableSpots() }, (_, index) => (
                <div key={`empty-${index}`} className="col-md-6 col-lg-4">
                  <div className="card h-100 border border-dashed bg-light">
                    <div className="card-body py-2 px-3 d-flex align-items-center justify-content-center">
                      <span className="text-muted small">+ Διαθέσιμο</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="d-flex justify-content-between mt-2 small">
              <span className="fw-semibold">{getCurrentPlayers()}/{getMaxPlayers()} παίκτες</span>
              <span className="text-success">
                {getAvailableSpots()} θέσ{getAvailableSpots() !== 1 ? "εις" : "η"} διαθέσιμ{getAvailableSpots() !== 1 ? "ες" : "η"}
              </span>
            </div>
          </div>

          {/* New Players to Join */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Παίκτες που Συμμετέχουν</h6>
              <div className="d-flex align-items-center gap-3">
                <span className="badge bg-primary">
                  Συμμετοχή: {getTotalNewPlayers()}/{getAvailableSpots()}
                </span>
                {additionalPlayers.length < getAvailableSpots() - 1 && (
                  <button className="btn btn-outline-primary btn-sm" onClick={addPlayer}>
                    + Προσθήκη Παίκτη
                  </button>
                )}
              </div>
            </div>

            {/* Current User (You) */}
            {currentUser && (
              <div className="card border-primary mb-3">
                <div className="card-header bg-primary bg-opacity-10 d-flex justify-content-between align-items-center py-2">
                  <span className="fw-semibold text-primary">Εσείς</span>
                  <span className="badge bg-primary">€{getPricePerPlayer().toFixed(2)}</span>
                </div>
                <div className="card-body py-2">
                  <div className="row g-2">
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={`${currentUser.firstName} ${currentUser.lastName}`}
                        disabled
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        value={currentUser.phone || ""}
                        disabled
                      />
                    </div>
                    <div className="col-md-4">
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
              <div key={index} className="card border mb-3">
                <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                  <span className="fw-semibold">Παίκτης {index + 2}</span>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-secondary">€{getPricePerPlayer().toFixed(2)}</span>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removePlayer(index)}
                    >
                      Αφαίρεση
                    </button>
                  </div>
                </div>
                <div className="card-body py-2">
                  <div className="row g-2">
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Πλήρες Όνομα *"
                        value={player.playerName}
                        onChange={(e) => updatePlayer(index, "playerName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        placeholder="Τηλέφωνο *"
                        value={player.playerPhone}
                        onChange={(e) => updatePlayer(index, "playerPhone", e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        placeholder="Email (Προαιρετικό)"
                        value={player.playerEmail}
                        onChange={(e) => updatePlayer(index, "playerEmail", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pricing Information */}
            <div className="alert alert-info small mb-0">
              <strong>Πληροφορίες Τιμών:</strong> Κάθε παίκτης πληρώνει €{getPricePerPlayer().toFixed(2)} (€{getCourt().price.toFixed(2)} ÷ {getMaxPlayers()} παίκτες)
            </div>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="alert alert-danger py-2 mb-3" role="alert">
              {error}
            </div>
          )}

          {/* Summary */}
          <div className="card bg-light border-0">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Περίληψη Συμμετοχής & Πληρωμή</h6>
              <div className="d-flex flex-column gap-2 small">
                <div className="d-flex justify-content-between">
                  <span>Γήπεδο:</span>
                  <span className="fw-semibold">{getCourt().name}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Ημερομηνία & Ώρα:</span>
                  <span className="fw-semibold">
                    {formatDate(getBookingDate())} στις {formatTime(getBookingTime().startTime)}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Παίκτες που Συμμετέχουν:</span>
                  <span className="fw-semibold">{getTotalNewPlayers()}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Τιμή ανά Παίκτη:</span>
                  <span className="fw-semibold">€{getPricePerPlayer().toFixed(2)}</span>
                </div>
                <hr className="my-2" />
                <div className="d-flex justify-content-between fs-5">
                  <span className="fw-bold">Συνολική Πληρωμή:</span>
                  <span className="fw-bold text-primary">€{getTotalPayment().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {serverError && (
            <div className="alert alert-danger py-2 mt-3" role="alert">
              {serverError}
            </div>
          )}
        </div>

        {/* Footer Actions */}
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
            disabled={loading || getAvailableSpots() === 0}
          >
            {loading
              ? "Επεξεργασία..."
              : `Πληρωμη €${getTotalPayment().toFixed(2)} & Συμμετοχη`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinBookingModal;
