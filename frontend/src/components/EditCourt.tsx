import { useState, useEffect } from "react";
import {
  getCitiesForDropdown,
  getCourtTypesForDropdown,
  getCourtEnvironmentForDropdown,
  GREEK_CITIES,
} from "../enums/CourtEnums";
import type { Court, CourtResponse, TimePeriod } from "../dtos/Court";

interface EditCourtProps {
  court: Court | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCourt: (court: Court) => void;
  existingCourts: CourtResponse[];
}

const EditCourt: React.FC<EditCourtProps> = ({
  court,
  isOpen,
  onClose,
  onUpdateCourt,
  existingCourts,
}) => {
  const [formData, setFormData] = useState<Court | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof Court["court"], string>>
  >({});
  const [activeTab, setActiveTab] = useState<"details" | "availability">(
    "details",
  );
  const [periodErrors, setPeriodErrors] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    if (court) {
      setFormData({ ...court });
      setErrors({});
      setActiveTab("details");
    }
  }, [court]);

  const validateForm = (): boolean => {
    if (!formData) return false;

    const newErrors: Partial<Record<keyof Court["court"], string>> = {};

    if (!formData.court.name.trim()) {
      newErrors.name = "Το όνομα γηπέδου είναι υποχρεωτικό";
    } else if (
      existingCourts.some(
        (c) =>
          c.id !== formData.court.id &&
          c.name.toLowerCase() === formData.court.name.toLowerCase(),
      )
    ) {
      newErrors.name = "Υπάρχει ήδη γήπεδο με αυτό το όνομα";
    }

    if (!formData.court.city) {
      newErrors.city = "Η πόλη είναι υποχρεωτική";
    }

    if (!formData.court.address.trim()) {
      newErrors.address = "Η διεύθυνση είναι υποχρεωτική";
    }

    if (formData.court.price <= 0) {
      newErrors.price = "Η τιμή πρέπει να είναι μεγαλύτερη από 0";
    }

    // Validate maps link format
    if (formData.court.mapsLink && !isValidMapsLink(formData.court.mapsLink)) {
      newErrors.mapsLink = "Παρακαλώ εισάγετε ένα έγκυρο σύνδεσμο Google Maps";
    }

    // Check for period validation errors
    const hasPeriodErrors = Object.values(periodErrors).some(dayErrors =>
      Object.keys(dayErrors).length > 0
    );

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && !hasPeriodErrors;
  };

  const isValidMapsLink = (link: string): boolean => {
    const mapsPatterns = [
      /^https:\/\/(www\.)?google\.(com|gr)\/maps/,
      /^https:\/\/maps\.google\.(com|gr)/,
      /^https:\/\/goo\.gl\/maps/,
      /^https:\/\/maps\.app\.goo\.gl/,
    ];
    return mapsPatterns.some((pattern) => pattern.test(link));
  };

  // Helper function to convert time string to minutes
  const timeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to check if two time periods overlap
  const periodsOverlap = (period1: TimePeriod, period2: TimePeriod): boolean => {
    const start1 = timeToMinutes(period1.startTime);
    const end1 = timeToMinutes(period1.endTime);
    const start2 = timeToMinutes(period2.startTime);
    const end2 = timeToMinutes(period2.endTime);

    return start1 < end2 && end1 > start2;
  };

  // Validate periods for a specific day
  const validatePeriods = (_day: string, periods: TimePeriod[]): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Sort periods by start time for validation
    const sortedPeriods = [...periods].sort((a, b) =>
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    sortedPeriods.forEach((period, index) => {
      const startMinutes = timeToMinutes(period.startTime);
      const endMinutes = timeToMinutes(period.endTime);

      // Check if start time is before end time
      if (startMinutes >= endMinutes) {
        errors[`${period.id}_startTime`] = "Η ώρα έναρξης πρέπει να είναι πριν την ώρα λήξης";
        errors[`${period.id}_endTime`] = "Η ώρα λήξης πρέπει να είναι μετά την ώρα έναρξης";
      }

      // Check for overlaps with next period
      if (index < sortedPeriods.length - 1) {
        const nextPeriod = sortedPeriods[index + 1];
        if (periodsOverlap(period, nextPeriod)) {
          errors[`${period.id}_endTime`] = "Η περίοδος επικαλύπτεται με την επόμενη";
          errors[`${nextPeriod.id}_startTime`] = "Η περίοδος επικαλύπτεται με την προηγούμενη";
        }
      }

      // Check if periods are in chronological order (additional check)
      const originalIndex = periods.findIndex(p => p.id === period.id);
      const originalNextIndex = periods.findIndex(p => p.id === sortedPeriods[index + 1]?.id);

      if (index < sortedPeriods.length - 1 && originalIndex > originalNextIndex) {
        const nextPeriod = sortedPeriods[index + 1];
        errors[`${period.id}_startTime`] = "Οι περίοδοι πρέπει να είναι σε χρονολογική σειρά";
        errors[`${nextPeriod.id}_startTime`] = "Οι περίοδοι πρέπει να είναι σε χρονολογική σειρά";
      }
    });

    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData && validateForm()) {
      onUpdateCourt(formData);
      onClose();
    }
  };

  const updateAvailability = (
    day: string,
    field: string,
    value: string | boolean,
  ) => {
    if (!formData) return;

    setFormData((prev) =>
      prev
        ? {
            ...prev,
            availability: {
              ...prev.availability,
              [day]: {
                ...prev.availability[day as keyof typeof prev.availability],
                [field]: value,
              },
            },
          }
        : null,
    );
  };

  const updatePeriod = (
    day: string,
    periodId: string,
    field: 'startTime' | 'endTime',
    value: string,
  ) => {
    if (!formData) return;

    // Update form data first
    const updatedFormData = {
      ...formData,
      availability: {
        ...formData.availability,
        [day]: {
          ...formData.availability[day as keyof typeof formData.availability],
          periods: formData.availability[day as keyof typeof formData.availability].periods.map(period =>
            period.id === periodId ? { ...period, [field]: value } : period
          ),
        },
      },
    };

    setFormData(updatedFormData);

    // Validate the updated periods for this day
    const daySchedule = updatedFormData.availability[day as keyof typeof updatedFormData.availability];
    const dayErrors = validatePeriods(day, daySchedule.periods);

    // Update period errors
    setPeriodErrors(prev => ({
      ...prev,
      [day]: dayErrors
    }));
  };

  const addPeriod = (day: string) => {
    if (!formData) return;

    const daySchedule = formData.availability[day as keyof typeof formData.availability];
    if (daySchedule.periods.length >= 3) return; // Max 3 periods

    const newPeriodId = `${day.charAt(0)}${daySchedule.periods.length + 1}`;

    // Calculate smart default times based on existing periods
    let defaultStartTime = "09:00";
    let defaultEndTime = "17:00";

    if (daySchedule.periods.length > 0) {
      // Sort existing periods by start time
      const sortedPeriods = [...daySchedule.periods].sort((a, b) =>
        timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
      );
      const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
      const lastEndMinutes = timeToMinutes(lastPeriod.endTime);

      // Start new period 1 hour after the last period ends
      const newStartMinutes = lastEndMinutes + 60;
      const newEndMinutes = newStartMinutes + (8 * 60); // Default 8-hour period

      // Convert back to time strings, but cap at 23:59
      const startHours = Math.floor(Math.min(newStartMinutes, 23 * 60) / 60);
      const startMins = Math.min(newStartMinutes, 23 * 60) % 60;
      const endHours = Math.floor(Math.min(newEndMinutes, 23 * 60 + 59) / 60);
      const endMins = Math.min(newEndMinutes, 23 * 60 + 59) % 60;

      defaultStartTime = `${startHours.toString().padStart(2, '0')}:${startMins.toString().padStart(2, '0')}`;
      defaultEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    }

    const newPeriod: TimePeriod = {
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      id: newPeriodId
    };

    const updatedPeriods = [...daySchedule.periods, newPeriod];

    setFormData((prev) =>
      prev
        ? {
            ...prev,
            availability: {
              ...prev.availability,
              [day]: {
                ...prev.availability[day as keyof typeof prev.availability],
                periods: updatedPeriods,
              },
            },
          }
        : null,
    );

    // Validate the new periods
    const dayErrors = validatePeriods(day, updatedPeriods);
    setPeriodErrors(prev => ({
      ...prev,
      [day]: dayErrors
    }));
  };

  const removePeriod = (day: string, periodId: string) => {
    if (!formData) return;

    const daySchedule = formData.availability[day as keyof typeof formData.availability];
    if (daySchedule.periods.length <= 1) return; // At least 1 period

    const updatedPeriods = daySchedule.periods.filter(period => period.id !== periodId);

    setFormData((prev) =>
      prev
        ? {
            ...prev,
            availability: {
              ...prev.availability,
              [day]: {
                ...prev.availability[day as keyof typeof prev.availability],
                periods: updatedPeriods,
              },
            },
          }
        : null,
    );

    // Validate the remaining periods
    const dayErrors = validatePeriods(day, updatedPeriods);
    setPeriodErrors(prev => ({
      ...prev,
      [day]: dayErrors
    }));
  };

  const handleClose = () => {
    setFormData(null);
    setErrors({});
    setPeriodErrors({});
    setActiveTab("details");
    onClose();
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

  if (!isOpen || !formData) return null;

  return (
    <div
      className="modal-overlay-custom position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ zIndex: 1050 }}
    >
      <div
        className="modal-container-custom card shadow-lg border-0"
        style={{ maxWidth: "800px", width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
          <h5 className="mb-0 fw-bold">Επεξεργασία Γηπέδου: {court?.court.name}</h5>
          <button className="btn-close" onClick={handleClose} type="button" aria-label="Close" />
        </div>

        {/* Tab Navigation */}
        <div className="border-bottom">
          <ul className="nav nav-tabs border-0 px-3">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === "details" ? "active" : ""}`}
                onClick={() => setActiveTab("details")}
              >
                Στοιχεια Γηπεδου
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === "availability" ? "active" : ""}`}
                onClick={() => setActiveTab("availability")}
              >
                Διαθεσιμότητα
              </button>
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="d-flex flex-column" style={{ flex: 1, overflow: "hidden" }}>
          <div className="card-body overflow-auto" style={{ flex: 1 }}>
            {activeTab === "details" && (
              <div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Ονομα Γηπεδου *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? "is-invalid" : ""}`}
                      value={formData.court.name}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          court: { ...formData.court, name: e.target.value },
                        });
                        if (errors.name)
                          setErrors({ ...errors, name: undefined });
                      }}
                      placeholder="Εισάγετε όνομα γηπέδου"
                      required
                    />
                    {errors.name && (
                      <div className="invalid-feedback">{errors.name}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Πολη *</label>
                    <select
                      className={`form-select ${errors.city ? "is-invalid" : ""}`}
                      value={formData.court.city}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          court: {
                            ...formData.court,
                            city: e.target.value as typeof formData.court.city,
                          },
                        });
                        if (errors.city)
                          setErrors({ ...errors, city: undefined });
                      }}
                      required
                    >
                      <option value="">Επιλέξτε πόλη</option>
                      {getCitiesForDropdown().map((city) => (
                        <option
                          key={city.key}
                          value={
                            GREEK_CITIES[city.key as keyof typeof GREEK_CITIES]
                          }
                        >
                          {city.displayName}
                        </option>
                      ))}
                    </select>
                    {errors.city && (
                      <div className="invalid-feedback">{errors.city}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Τυπος Γηπεδου *</label>
                    <select
                      className="form-select"
                      value={formData.court.courtType}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          court: {
                            ...formData.court,
                            courtType: e.target
                              .value as typeof formData.court.courtType,
                          },
                        });
                      }}
                      required
                    >
                      {getCourtTypesForDropdown().map((type) => (
                        <option key={type.key} value={type.key}>
                          {type.displayName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Χωρος *</label>
                    <select
                      className="form-select"
                      value={formData.court.environment}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          court: {
                            ...formData.court,
                            environment: e.target
                              .value as typeof formData.court.environment,
                          },
                        });
                      }}
                      required
                    >
                      {getCourtEnvironmentForDropdown().map((env) => (
                        <option key={env.key} value={env.key}>
                          {env.displayName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Διευθυνση *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.address ? "is-invalid" : ""}`}
                      value={formData.court.address}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          court: { ...formData.court, address: e.target.value },
                        });
                        if (errors.address)
                          setErrors({ ...errors, address: undefined });
                      }}
                      placeholder="Εισάγετε διεύθυνση"
                      required
                    />
                    {errors.address && (
                      <div className="invalid-feedback">{errors.address}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Συνδεσμος Google Maps</label>
                    <input
                      type="url"
                      className={`form-control ${errors.mapsLink ? "is-invalid" : ""}`}
                      value={formData.court.mapsLink}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          court: { ...formData.court, mapsLink: e.target.value },
                        });
                        if (errors.mapsLink)
                          setErrors({ ...errors, mapsLink: undefined });
                      }}
                      placeholder="https://maps.google.com/..."
                    />
                    {errors.mapsLink && (
                      <div className="invalid-feedback">{errors.mapsLink}</div>
                    )}
                    <small className="form-text text-muted">
                      Προαιρετικό: Επικολλήστε ένα σύνδεσμο Google Maps
                    </small>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Τιμη ανα Κρατηση (€) *</label>
                    <input
                      type="number"
                      className={`form-control ${errors.price ? "is-invalid" : ""}`}
                      value={formData.court.price || ""}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          court: {
                            ...formData.court,
                            price: Number(e.target.value),
                          },
                        });
                        if (errors.price)
                          setErrors({ ...errors, price: undefined });
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                    {errors.price && (
                      <div className="invalid-feedback">{errors.price}</div>
                    )}
                    <small className="form-text text-muted">
                      Τιμή για μια κράτηση {formData.court.slotDuration || 1.5} ωρών
                    </small>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Διαρκεια Κρατησης (ωρες) *</label>
                    <select
                      className="form-select"
                      value={formData.court.slotDuration || 1.5}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          court: {
                            ...formData.court,
                            slotDuration: Number(e.target.value),
                          },
                        });
                      }}
                      required
                    >
                      <option value={0.5}>30 λεπτά</option>
                      <option value={1}>1 ώρα</option>
                      <option value={1.5}>1.5 ώρες</option>
                      <option value={2}>2 ώρες</option>
                      <option value={2.5}>2.5 ώρες</option>
                      <option value={3}>3 ώρες</option>
                    </select>
                    <small className="form-text text-muted">
                      Διάρκεια κάθε χρονικού διαστήματος κράτησης
                    </small>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="form-label fw-semibold">Κατασταση</label>
                  <div className="form-check form-switch">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="editActiveStatus"
                      checked={formData.court.active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          court: { ...formData.court, active: e.target.checked },
                        })
                      }
                    />
                    <label className="form-check-label" htmlFor="editActiveStatus">
                      {formData.court.active ? "Ενεργό" : "Ανενεργό"}
                    </label>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="form-label fw-semibold">Περιγραφη</label>
                  <textarea
                    className="form-control"
                    value={formData.court.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        court: { ...formData.court, description: e.target.value },
                      })
                    }
                    placeholder="Εισάγετε περιγραφή γηπέδου"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {activeTab === "availability" && (
              <div>
                <div className="mb-4">
                  <h6 className="fw-bold mb-1">Εβδομαδιαίο Πρόγραμμα Διαθεσιμότητας</h6>
                  <p className="text-secondary small mb-0">
                    Ορίστε ώρες λειτουργίας για κάθε μέρα της εβδομάδας
                  </p>
                </div>

                <div className="row g-3">
                  {Object.entries(formData.availability).map(
                    ([day, schedule]) => (
                      <div key={day} className="col-12">
                        <div className="card">
                          <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                            <span className="fw-semibold">
                              {getGreekDayName(day).charAt(0).toUpperCase() + getGreekDayName(day).slice(1)}
                            </span>
                            <div className="form-check form-switch mb-0">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id={`edit-available-${day}`}
                                checked={schedule.available}
                                onChange={(e) =>
                                  updateAvailability(
                                    day,
                                    "available",
                                    e.target.checked,
                                  )
                                }
                              />
                              <label className="form-check-label small" htmlFor={`edit-available-${day}`}>
                                {schedule.available ? "Ανοιχτά" : "Κλειστά"}
                              </label>
                            </div>
                          </div>

                          {schedule.available && (
                            <div className="card-body py-2">
                              {schedule.periods.map((period, index) => (
                                <div key={period.id} className="mb-2">
                                  <div className="d-flex align-items-center gap-2 mb-1">
                                    <span className="badge bg-secondary small">Περίοδος {index + 1}</span>
                                    {schedule.periods.length > 1 && (
                                      <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm py-0 px-1"
                                        onClick={() => removePeriod(day, period.id!)}
                                        title="Αφαίρεση περιόδου"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                  <div className="row g-2">
                                    <div className="col-6">
                                      <label className="form-label small mb-1">Ανοιγμα</label>
                                      <input
                                        type="time"
                                        value={period.startTime}
                                        onChange={(e) =>
                                          updatePeriod(
                                            day,
                                            period.id!,
                                            "startTime",
                                            e.target.value,
                                          )
                                        }
                                        className={`form-control form-control-sm ${
                                          periodErrors[day]?.[`${period.id}_startTime`] ? "is-invalid" : ""
                                        }`}
                                      />
                                      {periodErrors[day]?.[`${period.id}_startTime`] && (
                                        <div className="invalid-feedback small">
                                          {periodErrors[day][`${period.id}_startTime`]}
                                        </div>
                                      )}
                                    </div>
                                    <div className="col-6">
                                      <label className="form-label small mb-1">Κλεισιμο</label>
                                      <input
                                        type="time"
                                        value={period.endTime}
                                        onChange={(e) =>
                                          updatePeriod(
                                            day,
                                            period.id!,
                                            "endTime",
                                            e.target.value,
                                          )
                                        }
                                        className={`form-control form-control-sm ${
                                          periodErrors[day]?.[`${period.id}_endTime`] ? "is-invalid" : ""
                                        }`}
                                      />
                                      {periodErrors[day]?.[`${period.id}_endTime`] && (
                                        <div className="invalid-feedback small">
                                          {periodErrors[day][`${period.id}_endTime`]}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {schedule.periods.length < 3 && (
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm mt-2"
                                  onClick={() => addPeriod(day)}
                                >
                                  + Προσθήκη περιόδου
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
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
              Ενημερωση Γηπεδου
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCourt;
