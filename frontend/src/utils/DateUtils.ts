// Greek date formatting utilities

/**
 * Formats a date string to Greek format (dd/mm/yyyy)
 * @param dateString - Date string in ISO format (yyyy-mm-dd) or Date object
 * @returns Formatted date in dd/mm/yyyy format
 */
export const formatDateToGreek = (dateString: string | Date): string => {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    return "";
  }

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Formats a date string to Greek format with day name (e.g., "Δευτέρα, 25/12/2023")
 * @param dateString - Date string in ISO format (yyyy-mm-dd) or Date object
 * @returns Formatted date with day name in Greek
 */
export const formatDateToGreekWithDay = (dateString: string | Date): string => {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    return "";
  }

  const greekDays = [
    "Κυριακή",
    "Δευτέρα",
    "Τρίτη",
    "Τετάρτη",
    "Πέμπτη",
    "Παρασκευή",
    "Σάββατο",
  ];

  const dayName = greekDays[date.getDay()];
  const formattedDate = formatDateToGreek(date);

  return `${dayName}, ${formattedDate}`;
};

/**
 * Formats a date string for display in tables and lists
 * @param dateString - Date string in ISO format (yyyy-mm-dd) or Date object
 * @returns Formatted date in dd/mm/yyyy format
 */
export const formatDateForDisplay = (dateString: string | Date): string => {
  return formatDateToGreek(dateString);
};

/**
 * Converts Greek date format (dd/mm/yyyy) to ISO format (yyyy-mm-dd)
 * @param greekDate - Date string in dd/mm/yyyy format
 * @returns Date string in yyyy-mm-dd format for API calls
 */
export const convertGreekDateToISO = (greekDate: string): string => {
  const parts = greekDate.split("/");
  if (parts.length !== 3) {
    return "";
  }

  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

/**
 * Gets today's date in Greek format
 * @returns Today's date in dd/mm/yyyy format
 */
export const getTodayInGreekFormat = (): string => {
  return formatDateToGreek(new Date());
};

/**
 * Formats time to Greek standards (24-hour format)
 * @param time - Time string in HH:mm format
 * @returns Formatted time string
 */
export const formatTimeToGreek = (time: string): string => {
  return time; // Greek standard already uses 24-hour format
};

/**
 * Formats a date string to ISO 8601 format for Java ZonedDateTime parsing (start of day)
 * @param dateString - Date string from HTML date input (YYYY-MM-DD)
 * @returns ISO 8601 formatted date-time string or undefined if invalid
 */
export const formatDateFromForZonedDateTime = (dateString: string): string | undefined => {
  if (!dateString) return undefined;

  // HTML date inputs provide YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRegex.test(dateString)) {
    // Additional validation to ensure it's a valid date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return `${dateString}T00:00:00`;
    }
  }

  return undefined;
};

/**
 * Formats a date string to ISO 8601 format for Java ZonedDateTime parsing (end of day)
 * @param dateString - Date string from HTML date input (YYYY-MM-DD)
 * @returns ISO 8601 formatted date-time string or undefined if invalid
 */
export const formatDateToForZonedDateTime = (dateString: string): string | undefined => {
  if (!dateString) return undefined;

  // HTML date inputs provide YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRegex.test(dateString)) {
    // Additional validation to ensure it's a valid date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return `${dateString}T23:59:59`;
    }
  }

  return undefined;
};

/**
 * Validates that dateFrom is not later than dateTo
 * @param dateFrom - Start date string
 * @param dateTo - End date string
 * @returns true if valid, false otherwise
 */
export const validateDateRange = (dateFrom?: string, dateTo?: string): boolean => {
  if (!dateFrom || !dateTo) return true; // If either is missing, no validation needed
  
  const fromDate = new Date(dateFrom);
  const toDate = new Date(dateTo);
  
  return fromDate <= toDate;
};

/**
 * Gets today's date in YYYY-MM-DD format
 * @returns Today's date string
 */
export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Gets the maximum date for booking (3 months from today) in YYYY-MM-DD format
 * @returns Maximum booking date string
 */
export const getMaxBookingDate = (): string => {
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setMonth(today.getMonth() + 3);
  return maxDate.toISOString().split('T')[0];
};

/**
 * Gets the minimum date for booking (today) in YYYY-MM-DD format
 * @returns Minimum booking date string
 */
export const getMinBookingDate = (): string => {
  return getTodayDateString();
};
