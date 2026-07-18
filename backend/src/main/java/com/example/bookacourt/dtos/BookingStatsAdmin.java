package com.example.bookacourt.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class BookingStatsAdmin {
    private int totalBookings;
    private int totalActiveCourts;
    private double todaysRevenue;
    private int openBookingsCount;
    private List<BookingRequest> recentBookings;
}