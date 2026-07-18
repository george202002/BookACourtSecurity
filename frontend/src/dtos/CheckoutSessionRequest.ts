import type { BookingDTO } from "./Booking"

export interface CheckoutSessionRequest {
    bookingId: string,
    bookingStatus: BookingDTO["status"],
    priceInCents: number,
    userId: string
}