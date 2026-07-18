package com.example.bookacourt.controllers;

import com.example.bookacourt.dtos.*;
import com.example.bookacourt.entities.BookingEntity;
import com.example.bookacourt.exceptions.UnauthorizedAccessException;
import com.example.bookacourt.services.BookingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private static final Logger log = LoggerFactory.getLogger(BookingController.class);

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin-bookings")
    public ResponseEntity<?> getAdminBookings(
            @RequestBody FilterCriteria filters,
            Pageable pageable) {
        try {
            log.info("Fetching bookings with filters: {}", filters);

            Page<BookingRequest> bookings = bookingService.getBookings(filters, pageable);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            log.error("Error fetching bookings", e);
            return ResponseEntity.badRequest().body("Error fetching bookings: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/my-bookings")
    public ResponseEntity<?> getUserBookings(
            @RequestBody FilterCriteria filters,
            Pageable pageable) {
        try {
            log.info("Fetching user bookings with filters: {}", filters);

            Page<BookingRequest> bookings = bookingService.getBookings(filters, pageable);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            log.error("Error fetching user bookings", e);
            return ResponseEntity.badRequest().body("Error fetching user bookings: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/stats")
    public ResponseEntity<?> getUserBookingStats() {
        try {
            log.info("Fetching user booking stats");
            BookingStats bookings = bookingService.getUserBookingStats();
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            log.error("Error fetching user booking stats", e);
            return ResponseEntity.badRequest().body("Error fetching user booking stats: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/stats")
    public ResponseEntity<?> getAdminBookingStats() {
        try {
            log.info("Fetching admin booking stats");
            BookingStatsAdmin bookings = bookingService.getAdminBookingStats();
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            log.error("Error fetching admin booking stats", e);
            return ResponseEntity.badRequest().body("Error fetching admin booking stats: " + e.getMessage());
        }
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping("/by-date")
    public ResponseEntity<?> getBookingsByDate(
            @RequestParam Long courtId,
            @RequestParam Instant date) {
        try {
            log.info("Fetching bookings for court ID: {} on date: {}", courtId, date);
            List<BookingEntity> bookings = bookingService.getBookingsByCourtAndDate(courtId, date);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            log.error("Error fetching bookings by date", e);
            return ResponseEntity.badRequest().body("Error fetching bookings by date: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/open")
    public ResponseEntity<?> getOpenBookings(
            @RequestBody FilterCriteria filters,
            Pageable pageable) {
        try {
            log.info("Fetching open bookings with filters: {}", filters);

            Page<BookingRequest> bookings = bookingService.getOpenBookings(filters, pageable);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            log.error("Error fetching open bookings", e);
            return ResponseEntity.badRequest().body("Error fetching open bookings: " + e.getMessage());
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody BookingRequest bookingRequest) {
        try {
            log.info("Creating a new booking for user ID: {}", bookingRequest.getBooking().getUser().getId());
            BookingEntity createdBooking = bookingService.createBooking(bookingRequest);
            return ResponseEntity.ok(createdBooking);
        } catch (Exception e) {
            log.error("Error creating booking", e);
            return ResponseEntity.badRequest().body("Error creating booking: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{bookingId}/join")
    public ResponseEntity<?> joinBooking(@RequestBody BookingRequest bookingRequest,
                                           @PathVariable UUID bookingId) {
        try {
            log.info("Joining booking for user ID: {}", bookingRequest.getBooking().getUser().getId());
            BookingEntity joinedBooking = bookingService.joinBooking(bookingRequest, bookingId);
            return ResponseEntity.ok(joinedBooking);
        } catch (Exception e) {
            log.error("Error joining booking", e);
            return ResponseEntity.badRequest().body("Error joining booking: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable UUID bookingId) {
        try {
            log.info("Attempting to cancel booking with ID: {}", bookingId);
            bookingService.cancelBooking(bookingId);
            return ResponseEntity.ok("Booking canceled successfully.");
        } catch (UnauthorizedAccessException e) {
            log.error("Unauthorized cancel attempt for booking with ID {}: {}", bookingId, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error canceling booking with ID {}: {}", bookingId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{bookingId}")
    public ResponseEntity<?> editBooking(@RequestBody BookingRequest bookingRequest,
                                           @PathVariable UUID bookingId) {
        try {
            log.info("Updating booking with ID: {}", bookingId);
            BookingEntity updatedBooking = bookingService.editBooking(bookingRequest, bookingId);
            return ResponseEntity.ok(updatedBooking);
        } catch (Exception e) {
            log.error("Error updating booking with ID: {}", bookingId, e);
            return ResponseEntity.badRequest().body("Error updating booking: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{bookingId}")
    public ResponseEntity<?> deleteBooking(@PathVariable UUID bookingId) {
        try {
            log.info("Deleting booking with ID: {}", bookingId);
            boolean success = bookingService.deleteBooking(bookingId);
            return ResponseEntity.ok(success);
        } catch (Exception e) {
            log.error("Error deleting booking with ID: {}", bookingId, e);
            return ResponseEntity.badRequest().body("Error deleting booking: " + e.getMessage());
        }
    }
}