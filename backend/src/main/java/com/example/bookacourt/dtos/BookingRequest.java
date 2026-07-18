package com.example.bookacourt.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequest {
    private BookingDTO booking;
    private List<BookingPlayerRequest> players;
    private Long priceInCents;
}