package com.example.bookacourt.services;

import com.example.bookacourt.dtos.*;
import com.example.bookacourt.enums.BookingStatus;
import com.example.bookacourt.enums.PaymentStatus;
import com.example.bookacourt.entities.*;
import com.example.bookacourt.exceptions.UnauthorizedAccessException;
import com.example.bookacourt.repositories.*;
import com.stripe.model.Refund;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    @Value("${frontend.url}")
    private String frontendUrl;

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final BookingPlayerRepository bookingPlayerRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;
    private final CourtRepository courtRepository;
    private final EmailService emailService;
    private final CurrentUserService currentUserService;

    public BookingService(BookingRepository bookingRepository, UserRepository userRepository,
                          BookingPlayerRepository bookingPlayerRepository, PaymentRepository paymentRepository,
                          PaymentService paymentService, CourtRepository courtRepository, EmailService emailService,
                          CurrentUserService currentUserService) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.bookingPlayerRepository = bookingPlayerRepository;
        this.paymentRepository = paymentRepository;
        this.paymentService = paymentService;
        this.courtRepository = courtRepository;
        this.emailService = emailService;
        this.currentUserService = currentUserService;
    }

    /**
     * Fetch all bookings from the database
     */
    public Page<BookingRequest> getBookings(FilterCriteria filters, Pageable pageable) {

        Page<BookingEntity> bookings;
        UserEntity user = currentUserService.getAuthenticatedUser();

        Instant dateFrom = filters.getDateFrom();
        Instant dateTo = filters.getDateTo();

        if(filters.isAdmin()){
            // Fetch bookings with filters
            bookings = bookingRepository.findFilteredBookingsAdmin(
                    filters.getSearchTerm() != null ? filters.getSearchTerm(): "" ,
                    filters.getCity(),
                    filters.getCourtType(),
                    filters.getEnvironment(),
                    filters.getStatus(),
                    filters.getCourtId(),
                    dateFrom,
                    dateTo,
                    user.getId(),
                    pageable
            );

        }else{
            // Fetch bookings with filters
            bookings = bookingRepository.findFilteredBookingsUser(
                    filters.getSearchTerm() != null ? filters.getSearchTerm(): "" ,
                    filters.getCity(),
                    filters.getStatus(),
                    filters.getCourtType(),
                    filters.getEnvironment(),
                    user.getId(),
                    pageable
            );
        }

        if(bookings == null){
            throw new IllegalArgumentException("No bookings found");
        }

        // Map Booking entries with associated BookingPlayers to BookingRequest objects
        return bookings.map(booking -> {
            // Fetch players associated with the booking
            List<BookingPlayerEntity> players = bookingPlayerRepository.findByBookingId(booking.getId());
            List<BookingPlayerRequest> bookingPlayerRequests = mapBookingPlayers(players);

            // Calculate price
            Long priceInCents = filters.isAdmin()
                    ? calculateTotalBookingPrice(booking.getId())
                    : calculateUserBookingPrice(players, user.getId());

            // Map to BookingRequest
            return new BookingRequest(mapToBookingDTO(booking), bookingPlayerRequests, priceInCents);
        });
    }

    public BookingStats getUserBookingStats(){
        UserEntity user = currentUserService.getAuthenticatedUser();

        int totalBookings = bookingRepository.countBookingByUser(user.getId());
        int upcomingBookingsCount = bookingRepository.countUpcomingBookings(user.getId());
        int completedBookings = bookingRepository.countCompletedBookings(user.getId());
        int cancelledBookings = bookingRepository.countCancelledBookings(user.getId());
        Long thisMonthSpentInCents = bookingRepository.getThisMonthSpent(user.getId());
        double thisMonthSpent = thisMonthSpentInCents != null? thisMonthSpentInCents / 100.00 : 0.00;

        List<BookingRequest> upcomingBookings;
        List<BookingEntity> bookings = bookingRepository.fetchUpcomingBookings3(user.getId());

        // Map Booking entries with associated BookingPlayers to BookingRequest objects
        upcomingBookings = bookings.stream()
                .map(booking -> {
                    List<BookingPlayerEntity> players = bookingPlayerRepository.findByBookingId(booking.getId());

                    List<BookingPlayerRequest> bookingPlayerRequests = mapBookingPlayers(players);

                    Long priceInCents = calculateUserBookingPrice(players, user.getId());

                    return new BookingRequest(mapToBookingDTO(booking), bookingPlayerRequests, priceInCents);
                })
                .toList();

        return new BookingStats(totalBookings, upcomingBookingsCount, upcomingBookings,
                completedBookings, cancelledBookings, thisMonthSpent);
    }

    public BookingStatsAdmin getAdminBookingStats(){
        UserEntity user = currentUserService.getAuthenticatedUser();

        int totalBookings = bookingRepository.countTotalBookingsAdmin(user.getId());
        int totalActiveCourts = courtRepository.countActiveCourts(user.getId());
        int openBookingsCount = bookingRepository.countOpenBookings(user.getId());
        Long todaysRevenueInCents = bookingRepository.getTodaysRevenue(user.getId());
        double todaysRevenue = todaysRevenueInCents != null? todaysRevenueInCents / 100.00 : 0.00;

        List<BookingRequest> recentBookings;
        List<BookingEntity> bookings = bookingRepository.fetchRecentBookings5(user.getId());

        // Map Booking entries with associated BookingPlayers to BookingRequest objects
        recentBookings = bookings.stream()
                .map(booking -> {
                    List<BookingPlayerEntity> players = bookingPlayerRepository.findByBookingId(booking.getId());

                    List<BookingPlayerRequest> bookingPlayerRequests = mapBookingPlayers(players);

                    Long priceInCents = calculateTotalBookingPrice(booking.getId());

                    return new BookingRequest(mapToBookingDTO(booking), bookingPlayerRequests, priceInCents);
                })
                .toList();

        return new BookingStatsAdmin(totalBookings, totalActiveCourts, todaysRevenue,
                openBookingsCount, recentBookings);


    }

    public List<BookingEntity> getBookingsByCourtAndDate(Long courtId, Instant date) {
        try {
            Instant dayEnd = date.plus(1, ChronoUnit.DAYS);
            List<BookingEntity> bookings = bookingRepository.findByCourtIdAndDateRange(courtId, date, dayEnd);
            log.info("Fetched {} bookings for court {} and date {}", bookings.size(), courtId, date);
            return bookings;
        } catch (Exception e) {
            log.error("Error fetching bookings by court and date", e);
            throw new IllegalArgumentException("Invalid date format or courtId", e);
        }
    }

    /**
     * Fetch all open bookings from the database
     */
    public Page<BookingRequest> getOpenBookings(FilterCriteria filters, Pageable pageable) {
        UserEntity user = currentUserService.getAuthenticatedUser();

        // Repository call
        Page<BookingEntity> bookingsPage = bookingRepository.findFilteredOpenBookingsUser(
                filters.getSearchTerm() != null ? filters.getSearchTerm(): "" ,
                filters.getCity(),
                filters.getCourtType(),
                filters.getEnvironment(),
                filters.getMinPrice(),
                filters.getMaxPrice(),
                user.getId(),
                pageable
        );

        return bookingsPage.map(booking -> {
            // Fetch players associated with the booking
            List<BookingPlayerEntity> players = bookingPlayerRepository.findByBookingId(booking.getId());
            List<BookingPlayerRequest> bookingPlayerRequests = new ArrayList<>();
            for (BookingPlayerEntity player : players) {
                bookingPlayerRequests.add(toRequest(player));
            }

            // Map to BookingRequest
            return new BookingRequest(mapToBookingDTO(booking), bookingPlayerRequests, null);
        });
    }

    @Transactional
    public BookingEntity editBooking(BookingRequest bookingRequest, UUID bookingId) {
        log.info("Updating booking with ID: {}", bookingId);
        BookingDTO booking = bookingRequest.getBooking();

        // Fetch the booking by ID
        BookingEntity existingBooking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking with ID " + bookingId + " not found"));

        if(existingBooking.getStatus() != BookingStatus.OPEN && existingBooking.getStatus() != BookingStatus.FILLED){
            throw new IllegalArgumentException("Booking with ID " + bookingId + " has invalid status.");
        }

        if(booking.getDateTime() != null){
            existingBooking.setDateTime(booking.getDateTime());
        }
        if (booking.getNotes() != null) {
            existingBooking.setNotes(booking.getNotes());
        }

        // Save the updated booking
        return bookingRepository.save(existingBooking);
    }

    @Transactional
    public boolean deleteBooking(UUID bookingId) {
        try {
            log.info("Deleting booking with ID: {}", bookingId);

            BookingEntity existingBooking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new IllegalArgumentException("Booking with ID " + bookingId + " not found"));

            if(existingBooking.getStatus() != BookingStatus.OPEN && existingBooking.getStatus() != BookingStatus.FILLED){
                throw new IllegalArgumentException("Booking with ID " + bookingId + " has invalid status.");
            }

            List<BookingPlayerEntity> playersInBooking = bookingPlayerRepository.findByBookingId(bookingId);
            Set<PaymentEntity> payments = new HashSet<>();
            for (BookingPlayerEntity player : playersInBooking) {
                payments.add(player.getPayment());
            }
            for (PaymentEntity payment : payments) {
                if (payment!= null) {
                    Refund refund = paymentService.refundBooking(payment.getStripePaymentIntentId());
                    payment.setStatus(PaymentStatus.REFUNDED);
                    payment.setRefundId(refund.getId());
                    paymentRepository.save(payment);
                }
            }

            existingBooking.setStatus(BookingStatus.CANCELLED);
            bookingPlayerRepository.deleteAll(playersInBooking);
            bookingRepository.save(existingBooking);
            log.info("Booking with ID {} was successfully deleted.", bookingId);
            return true;
        }catch (Exception e){
            log.error("Error deleting booking with ID {}: {}", bookingId, e.getMessage());
            throw new IllegalArgumentException("Error deleting booking with ID " + bookingId + ": " + e.getMessage());
        }
    }

    @Transactional
    public BookingEntity joinBooking(BookingRequest bookingRequest, UUID bookingId) {
        log.info("Joining booking with ID: {}", bookingId);
        List<BookingPlayerRequest> players = bookingRequest.getPlayers();

        // Fetch the booking by ID
        BookingEntity existingBooking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking with ID " + bookingId + " not found"));

        if(existingBooking.getStatus() != BookingStatus.OPEN){
            throw new IllegalArgumentException("Booking with ID " + bookingId + " has invalid status.");
        }

        // Update fields
        existingBooking.setExpirationTime(Instant.now().plus(15, ChronoUnit.MINUTES));
        existingBooking.setStatus(BookingStatus.PENDING);

        // Save the updated booking
        BookingEntity updatedBooking = bookingRepository.save(existingBooking);

        List<BookingPlayerEntity> existingPlayers = bookingPlayerRepository.findByBookingId(bookingId);
        for(BookingPlayerEntity player: existingPlayers){
            if(player.isLastAdded()) {
                player.setLastAdded(false);
                bookingPlayerRepository.save(player);
            }
        }

        // Handle and Persist BookingPlayers
        validatePlayers(players, updatedBooking);

        // Return updated BookingRequest
        return updatedBooking;
    }

    @Transactional
    public void cancelBooking(UUID bookingId) {
        try {
            log.info("Canceling booking with ID: {}", bookingId);

            BookingEntity existingBooking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new IllegalArgumentException("Booking with ID " + bookingId + " not found"));

            if(existingBooking.getStatus() != BookingStatus.OPEN && existingBooking.getStatus() != BookingStatus.FILLED){
                throw new IllegalArgumentException("Booking with ID " + bookingId + " has invalid status.");
            }

            UserEntity user = currentUserService.getAuthenticatedUser();

            Instant now = Instant.now(); // Get the current date and time
            Instant bookingStartTime = existingBooking.getDateTime();

            if (bookingStartTime.minus(1, ChronoUnit.HOURS).isBefore(now)) {
                throw new IllegalArgumentException("Bookings cannot be canceled within 1 hour of the start time.");
            }

            List<BookingPlayerEntity> playersByUser = bookingPlayerRepository.findByAddedByIdAndBookingId(user.getId(), bookingId);
            if (playersByUser.isEmpty()) {
                throw new UnauthorizedAccessException("User " + user.getEmail() + " has no players in booking " + bookingId + " and cannot cancel it.");
            }
            List<BookingPlayerEntity> playersInBooking = bookingPlayerRepository.findByBookingId(bookingId);
            if (playersByUser.size() == playersInBooking.size()) {
                existingBooking.setStatus(BookingStatus.CANCELLED);
            } else {
                existingBooking.setStatus(BookingStatus.OPEN);
            }

            PaymentEntity payment = paymentRepository.findById(playersByUser.getFirst().getPayment().getId()).orElse(null);
            if (payment == null || payment.getStripePaymentIntentId() == null) {
                throw new IllegalArgumentException("No payment found for booking with ID " + bookingId);
            }
            Refund refund = paymentService.refundBooking(payment.getStripePaymentIntentId());
            payment.setStatus(PaymentStatus.REFUNDED);
            payment.setRefundId(refund.getId());

            paymentRepository.save(payment);
            bookingPlayerRepository.deleteAll(playersByUser);
            bookingRepository.save(existingBooking);
            log.info("Booking with ID {} was successfully canceled.", bookingId);
        }catch (UnauthorizedAccessException e){
            log.error("Unauthorized cancel attempt for booking with ID {}: {}", bookingId, e.getMessage());
            throw e;
        }catch (Exception e){
            log.error("Error cancelling booking with ID {}: {}", bookingId, e.getMessage());
            throw new IllegalArgumentException("Error cancelling booking with ID " + bookingId + ": " + e.getMessage());
        }
    }

    @Scheduled(cron = "0 0/10 * * * *") // Runs every 10 minutes
    @Transactional
    public void cancelUnfilledBookings() {
        try {
            log.info("Starting scheduled task to cancel unfilled bookings.");

            // Query for open bookings where the start time is less than an hour away.
            Instant oneHourFromNow = Instant.now().plus(1, ChronoUnit.HOURS);
            List<BookingEntity> unfilledBookings = bookingRepository
                    .findAllByStatusAndDateTimeWithinHour(BookingStatus.OPEN, Instant.now(), oneHourFromNow);

            for (BookingEntity booking : unfilledBookings) {
                log.info("Canceling unfilled booking with ID: {}", booking.getId());
                List<BookingPlayerEntity> playersInBooking = bookingPlayerRepository.findByBookingId(booking.getId());
                Set<PaymentEntity> payments = new HashSet<>();
                for (BookingPlayerEntity player : playersInBooking) {
                    payments.add(player.getPayment());
                }
                for (PaymentEntity payment : payments) {
                    Refund refund = paymentService.refundBooking(payment.getStripePaymentIntentId());
                    payment.setStatus(PaymentStatus.REFUNDED);
                    payment.setRefundId(refund.getId());
                    paymentRepository.save(payment);
                }

                booking.setStatus(BookingStatus.CANCELLED);
                bookingPlayerRepository.deleteAll(playersInBooking);
                bookingRepository.save(booking);
            }

            log.info("Finished scheduled task to cancel unfilled bookings.");
        }catch (Exception e){
            log.error("Error cancelling unfilled bookings: {}", e.getMessage());
            throw new IllegalArgumentException("Error cancelling unfilled bookings: " + e.getMessage());
        }
    }

    @Scheduled(cron = "0 0/5 * * * *") // Runs every 5 minutes
    @Transactional
    public void expirePendingBookings() {
        try {
            List<BookingEntity> expiredBookings = bookingRepository.findByStatusAndExpirationTimeBefore(BookingStatus.PENDING, Instant.now());
            for (BookingEntity booking : expiredBookings) {
                List<BookingPlayerEntity> playersInBooking = bookingPlayerRepository.findByBookingId(booking.getId());
                List<BookingPlayerEntity> playersToCancel =
                        playersInBooking.stream().filter(BookingPlayerEntity::isLastAdded).toList();
                if(playersToCancel.size() == playersInBooking.size()){
                    log.info("Refunding expired booking with ID: {}", booking.getId());
                    bookingPlayerRepository.deleteAll(playersInBooking);
                    booking.setStatus(BookingStatus.EXPIRED);
                }else{
                    log.info("Refunding last players and returning booking with ID: {} " +
                            "to status: {}", booking.getId(), BookingStatus.OPEN);
                    bookingPlayerRepository.deleteAll(playersToCancel);
                    booking.setStatus(BookingStatus.OPEN);
                }
                bookingRepository.save(booking);
            }
            log.info("Finished scheduled task to refund expired bookings.");
        }catch (Exception e){
            log.error("Error refunding expired bookings: {}", e.getMessage());
            throw new IllegalArgumentException("Error refunding expired bookings: " + e.getMessage());
        }
    }

    @Scheduled(cron = "0 0/30 * * * *") // Runs every 30 minutes
    @Transactional
    public void completeBookings() {
        try {
            log.info("Starting scheduled task to complete filled bookings.");

            List<BookingEntity> filledBookings = bookingRepository.findAllByStatusAndDateTimePast();

            for (BookingEntity booking : filledBookings) {
                log.info("Completing filled booking with ID: {}", booking.getId());
                booking.setStatus(BookingStatus.COMPLETED);
                bookingRepository.save(booking);
            }

            log.info("Finished scheduled task to complete filled bookings.");
        }catch (Exception e){
            log.error("Error completing filled bookings: {}", e.getMessage());
            throw new IllegalArgumentException("Error completing filled bookings: " + e.getMessage());
        }
    }

    /**
     * Create a new booking
     */
    @Transactional
    public BookingEntity createBooking(BookingRequest bookingRequest) {
        // Extract the booking and players from the request
        BookingDTO bookingFromRequest = bookingRequest.getBooking();
        List<BookingPlayerRequest> players = bookingRequest.getPlayers();

        // Fetch and validate the User
        UserEntity user = userRepository
                .findById(bookingFromRequest.getUser().getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "User with ID " + bookingFromRequest.getUser().getId() + " not found"));

        // Create and save the Booking
        BookingEntity booking = new BookingEntity();
        if(user.getRole().equals("ADMIN")){
            booking.setStatus(bookingFromRequest.getStatus());
        }else{
            booking.setStatus(BookingStatus.PENDING);
        }
        booking.setUser(user);
        booking.setNotes(bookingFromRequest.getNotes());
        booking.setDateTime(bookingFromRequest.getDateTime());
        booking.setCourt(bookingFromRequest.getCourt());
        booking.setExpirationTime(Instant.now().plus(30, ChronoUnit.MINUTES));
        BookingEntity updatedBooking = bookingRepository.save(booking); // Persist the Booking

        // Handle and Persist BookingPlayers
        validatePlayers(players, updatedBooking);

        return updatedBooking; // Return the created booking
    }

    @Transactional
    public void addPaymentToBooking(UUID bookingId, BookingStatus bookingStatus, UUID userId, Long amount, String paymentIntentId) {
        log.info("Adding payment to booking with ID: {}", bookingId);
        BookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking with ID " + bookingId + " not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            log.info("Booking with ID {} is expired. Refunding payment...", bookingId);
            try {
                paymentService.refundBooking(paymentIntentId);
            }catch (Exception e){
                log.error("Error refunding booking with ID {}: {}", bookingId, e.getMessage());
                throw new IllegalArgumentException("Error refunding booking with ID " + bookingId + ": " + e.getMessage());
            }
        }

        List<BookingPlayerEntity> bookingPlayers = bookingPlayerRepository.findByBookingId(bookingId)
                .stream()
                .filter(player -> player.getAddedBy() != null && player.getAddedBy().getId().equals(userId))
                .toList();

        if (bookingPlayers.isEmpty()) {
            throw new IllegalArgumentException("No BookingPlayer found for user with ID " + userId + " in booking with ID " + bookingId);
        }

        booking.setStatus(bookingStatus);
        booking = bookingRepository.save(booking);

        PaymentEntity payment = new PaymentEntity();
        payment.setBooking(booking);
        payment.setAmountInCents(amount);
        payment.setStripePaymentIntentId(paymentIntentId);
        payment.setStatus(PaymentStatus.PAID);
        payment.setUser(userRepository.findById(userId).orElseThrow());
        payment = paymentRepository.save(payment);

        for(BookingPlayerEntity player: bookingPlayers){
            player.setPayment(payment);
            bookingPlayerRepository.save(player);
        }
    }

    public void sendBookingConfirmationEmail(UUID bookingId, UUID userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        BookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking with ID " + bookingId + " not found"));

        Map<String, String> variables = Map.of(
                "firstName", user.getFirstName(),
                "bookingTime", booking.getDateTime().toString(),
                "courtName", booking.getCourt().getName(),
                "frontendUrl", frontendUrl
        );

        String emailContent = emailService.buildEmail("booking-confirmation.html", variables);
        emailService.send(user.getEmail(), "Επιβεβαίωση Κράτησης", emailContent);
    }

    private List<BookingPlayerRequest> mapBookingPlayers(List<BookingPlayerEntity> players) {
        List<BookingPlayerRequest> bookingPlayerRequests = new ArrayList<>();
        for (BookingPlayerEntity player : players) {
            bookingPlayerRequests.add(toRequest(player));
        }
        return bookingPlayerRequests;
    }

    private Long calculateTotalBookingPrice(UUID bookingId) {
        return paymentRepository.findAllByBookingId(bookingId).stream()
                .filter(Objects::nonNull)
                .mapToLong(PaymentEntity::getAmountInCents)
                .sum();

    }

    private Long calculateUserBookingPrice(List<BookingPlayerEntity> players, UUID userId) {
        return players.stream()
                .filter(player -> player.getUser() != null && player.getUser().getId().equals(userId))
                .map(BookingPlayerEntity::getPayment)
                .filter(Objects::nonNull)
                .mapToLong(PaymentEntity::getAmountInCents)
                .findFirst()
                .orElse(0L);
    }

    private static BookingPlayerRequest toRequest(BookingPlayerEntity player) {
        UUID userId = player.getUser() != null ? player.getUser().getId() : null;

        return new BookingPlayerRequest(
                userId,
                player.getPlayerName(),
                player.getPlayerEmail(),
                player.getPlayerPhone(),
                player.getAddedBy().getId(),
                player.isLastAdded()
        );
    }

    @Transactional
    protected void validatePlayers(List<BookingPlayerRequest> players, BookingEntity booking){
        for (BookingPlayerRequest player : players) {
            if (player.getPlayerName() == null || player.getPlayerName().isEmpty()) {
                throw new IllegalArgumentException("Player name is required");
            }
            if (player.getPlayerPhone() == null || player.getPlayerPhone().isEmpty()) {
                throw new IllegalArgumentException("Player phone is required");
            }

            BookingPlayerEntity bookingPlayer = new BookingPlayerEntity();
            // Set the user if provided
            if (player.getUserId() != null) {
                UserEntity playerUser = userRepository
                        .findById(player.getUserId())
                        .orElseThrow(() -> new IllegalArgumentException(
                                "User with ID " + player.getUserId() + " not found"));
                bookingPlayer.setUser(playerUser);
            }
            bookingPlayer.setBooking(booking);
            bookingPlayer.setPlayerName(player.getPlayerName());
            bookingPlayer.setPlayerPhone(player.getPlayerPhone());
            bookingPlayer.setPlayerEmail(player.getPlayerEmail());
            bookingPlayer.setAddedBy(userRepository.findById(player.getAddedBy()).orElseThrow());
            bookingPlayer.setLastAdded(true);

            try {
                bookingPlayerRepository.save(bookingPlayer);
            } catch (DataIntegrityViolationException e) {
                throw new IllegalArgumentException("Error saving booking-player: " + e.getMessage() );
            }
        }
    }

    private BookingDTO mapToBookingDTO(BookingEntity booking) {
        UserResponse userResponse = new UserResponse(
                booking.getUser().getId(),
                booking.getUser().getEmail(),
                booking.getUser().getFirstName(),
                booking.getUser().getLastName(),
                booking.getUser().getPhone(),
                booking.getUser().getRole()
        );

        return new BookingDTO(
                booking.getId(),
                booking.getCourt(),
                booking.getDateTime(),
                userResponse,
                booking.getStatus(),
                booking.getNotes(),
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }

}