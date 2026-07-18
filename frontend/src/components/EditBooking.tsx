import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { CourtResponse } from "../dtos/Court";
import type {
  BookingRequest,
  BookingDTO,
  Players,
} from "../dtos/Booking";
import {
  getBookingsByDate,
} from "../services/BookingsService";
import { formatDateForDisplay, formatDateFromForZonedDateTime, getMinBookingDate, getMaxBookingDate } from "../utils/DateUtils";
import { generateTimeSlots, formatTimeDisplay, type TimeSlot } from "../utils/TimeSlotUtils";

interface EditBookingProps {
  bookingReq: BookingRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateBooking: (id: string, bookingRequest: BookingRequest) => void;
  courts: CourtResponse[];
}

const EditBooking: React.FC<EditBookingProps> = ({
  bookingReq: bookingReq,
  isOpen,
  onClose,
  onUpdateBooking,
  courts,
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<BookingDTO | null>(null);
  const [players, setPlayers] = useState<Players[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<CourtResponse | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPriceInCents, setCurrentPriceInCents] = useState(0);

  useEffect(() => {
    if (bookingReq) {
      setFormData({ ...bookingReq.booking });
      setPlayers([...bookingReq.players]);
      setCurrentPriceInCents(bookingReq.priceInCents || 0);

      const courtId = bookingReq.booking.court.id;
      const date = new Date(bookingReq.booking.dateTime).toISOString().split('T')[0];

      const court = courts.find((c) => c.id === courtId);
      setSelectedCourt(court || null);
      setSelectedDate(date);

      // Set selected time slot from dateTime
      const bookingDateTime = new Date(bookingReq.booking.dateTime);
      const startTime = bookingDateTime.toTimeString().substring(0, 5); // HH:mm
      const endDateTime = new Date(bookingDateTime.getTime() + (court?.slotDuration || 1.5) * 60 * 60 * 1000);
      const endTime = endDateTime.toTimeString().substring(0, 5); // HH:mm

      setSelectedTimeSlot({
        startTime,
        endTime,
        available: true
      });
    }
  }, [bookingReq, courts]);

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
      // Get existing bookings for this date (excluding current booking if editing)
      const existingBookings = await getBookingsByDate(selectedCourt.id, date, navigate);

      // Filter out current booking if editing
      const filteredBookings = formData ?
        existingBookings.filter(booking => booking.id !== formData.id) :
        existingBookings;

      // Generate time slots based on court configuration and existing bookings
      const slots = generateTimeSlots(selectedCourt, selectedDate, filteredBookings);

      // Mark current booking's slot as available if editing
      if (formData && selectedDate == formData.dateTime.substring(0, 10)) {
        const bookingDateTime = new Date(formData.dateTime);
        const currentStartTime = bookingDateTime.toTimeString().substring(0, 5); // HH:mm
        const endDateTime = new Date(bookingDateTime.getTime() + (selectedCourt.slotDuration || 1.5) * 60 * 60 * 1000);
        const currentEndTime = endDateTime.toTimeString().substring(0, 5); // HH:mm

        const currentSlotIndex = slots.findIndex(slot =>
          slot.startTime === currentStartTime && slot.endTime === currentEndTime
        );
        if (currentSlotIndex >= 0) {
          slots[currentSlotIndex].available = true;
        } else {
          // Add current slot if not in generated slots
          slots.push({
            startTime: currentStartTime,
            endTime: currentEndTime,
            available: true
          });
          slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
        }
      }

      setTimeSlots(slots);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      setTimeSlots([]);
    }
  }, [selectedCourt, selectedDate, formData, navigate]);

  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  // Clear phone errors when players list changes
  useEffect(() => {
    if (errors.players?.includes('phone number')) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { players: _, ...restErrors } = errors;
      setErrors(restErrors);
    }
  }, [players]); // eslint-disable-line react-hooks/exhaustive-deps



  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (!selectedCourt || !slot.available) return;
    setSelectedTimeSlot(slot);
  };



  const validateForm = (): boolean => {
    if (!formData) return false;

    const newErrors: Record<string, string> = {};

    if (!selectedDate) {
      newErrors.date = "Παρακαλώ επιλέξτε ημερομηνία";
    }

    if (!selectedTimeSlot) {
      newErrors.slot = "Παρακαλώ επιλέξτε ωράριο";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData && selectedTimeSlot && selectedCourt && validateForm()) {
      const updatedBooking: BookingDTO = {
        ...formData,
        court: selectedCourt,
        dateTime: new Date(`${selectedDate}T${selectedTimeSlot.startTime}:00`).toISOString(),
      };

      const bookingRequest: BookingRequest = {
        booking: updatedBooking,
        players: players,
        priceInCents: currentPriceInCents,
      };

      onUpdateBooking(formData.id, bookingRequest);
      onClose();
    }
  };

  const handleClose = () => {
    setErrors({});
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

  if (!isOpen || !formData) return null;

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
          <h5 className="mb-0 fw-bold">Επεξεργασία Κράτησης</h5>
          <button className="btn-close" onClick={handleClose} type="button" aria-label="Close" />
        </div>

        <form onSubmit={handleSubmit} className="d-flex flex-column" style={{ flex: 1, overflow: "hidden" }}>
          <div className="card-body overflow-auto" style={{ flex: 1 }}>
            <div className="mb-4">
              <h6 className="fw-bold mb-1">Στοιχεία Κράτησης</h6>
              <p className="text-secondary small mb-3">
                Επεξεργασία ημερομηνίας και ώρας για την κράτηση
              </p>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Γήπεδο (Μη Επεξεργάσιμο)</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedCourt ? `${selectedCourt.name} - €${selectedCourt.price}/κράτηση` : ""}
                  disabled
                  readOnly
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Ημερομηνία *</label>
                <input
                  type="date"
                  className={`form-control ${errors.date ? "is-invalid" : ""}`}
                  value={selectedDate}
                  min={getMinDate()}
                  max={getMaxDate()}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTimeSlot(null);
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
                        <div className="small text-muted">€{selectedCourt?.price}</div>
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
              <h6 className="fw-bold mb-1">Παίκτες (Μη Επεξεργάσιμο)</h6>
              <p className="text-secondary small mb-3">
                Οι παίκτες δεν μπορούν να αλλάξουν κατά την επεξεργασία
              </p>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <label className="form-label fw-semibold mb-0">Παίκτες</label>
                <span className="badge bg-primary">{players.length} παίκτες</span>
              </div>

              {/* Display Players (Read-only) */}
              {players.map((player, index) => (
                <div key={player.playerPhone} className="card mb-2">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                    <span className="fw-semibold small">Παίκτης {index + 1}</span>
                    <span className="badge bg-success">€{getPricePerPlayer().toFixed(2)}</span>
                  </div>
                  <div className="card-body p-3">
                    <div className="row g-2">
                      <div className="col-12 col-md-4">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={player.playerName}
                          disabled
                          readOnly
                        />
                      </div>
                      <div className="col-6 col-md-4">
                        <input
                          type="tel"
                          className="form-control form-control-sm"
                          value={player.playerPhone}
                          disabled
                          readOnly
                        />
                      </div>
                      <div className="col-6 col-md-4">
                        <input
                          type="email"
                          className="form-control form-control-sm"
                          value={player.playerEmail || ""}
                          disabled
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedTimeSlot && (
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
                      {selectedTimeSlot
                        ? `${formatTimeDisplay(selectedTimeSlot.startTime)} - ${formatTimeDisplay(selectedTimeSlot.endTime)}`
                        : "Δεν έχει επιλεγεί ώρα"
                      }
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
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Επιπλέον σημειώσεις για αυτή την κράτηση..."
                rows={3}
              />
            </div>
          </div>

          <div className="card-footer bg-white border-top d-flex justify-content-end gap-2 py-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleClose}
            >
              Ακυρωση
            </button>
            <button type="submit" className="btn btn-primary">
              Ενημερωση Κρατησης
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBooking;
