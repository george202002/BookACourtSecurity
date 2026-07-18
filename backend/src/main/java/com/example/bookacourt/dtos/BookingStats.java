package com.example.bookacourt.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class BookingStats {
    private int totalBookings;
    private int upcomingBookingsCount;
    private List<BookingRequest> upcomingBookings;
    private int completedBookings;
    private int cancelledBookings;
    private double thisMonthSpent;
}