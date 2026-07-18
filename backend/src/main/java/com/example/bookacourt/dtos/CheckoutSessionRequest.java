package com.example.bookacourt.dtos;

import com.example.bookacourt.enums.BookingStatus;
import lombok.Data;

import java.util.UUID;

@Data
public class CheckoutSessionRequest {
    private UUID bookingId;
    private BookingStatus bookingStatus;
    private Long priceInCents;
    private UUID userId;
}