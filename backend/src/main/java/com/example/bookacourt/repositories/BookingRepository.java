package com.example.bookacourt.repositories;

import com.example.bookacourt.enums.BookingStatus;
import com.example.bookacourt.enums.CourtEnvironment;
import com.example.bookacourt.enums.CourtType;
import com.example.bookacourt.enums.GreekCity;
import com.example.bookacourt.entities.BookingEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<BookingEntity, UUID> {

    @Query("SELECT b FROM BookingEntity b " +
            "LEFT JOIN BookingPlayerEntity bp ON bp.booking.id = b.id " +
            "JOIN b.court court " +
            "WHERE (:status IS NULL OR b.status = :status) " +
                "AND (:courtId IS NULL OR court.id = :courtId) " +
                "AND (:playerSearch IS NULL OR " +
                    "(bp.playerName IS NOT NULL AND " +
                    "LOWER(CAST(bp.playerName AS string)) LIKE LOWER(CONCAT('%', :playerSearch, '%')))) " +
            "AND (:dateFrom IS NULL OR b.dateTime >= :dateFrom) " +
            "AND (:dateTo IS NULL OR b.dateTime <= :dateTo) " +
            "AND (:city IS NULL OR court.city = :city) " +
            "AND (:courtType IS NULL OR court.courtType = :courtType) " +
            "AND (:environment IS NULL OR court.environment = :environment) " +
            "AND (:userId IS NULL OR court.owner.id = :userId)")
    Page<BookingEntity> findFilteredBookingsAdmin(
            @Param("playerSearch") String playerSearch,
            @Param("city") GreekCity city,
            @Param("courtType") CourtType courtType,
            @Param("environment") CourtEnvironment environment,
            @Param("status") BookingStatus status,
            @Param("courtId") Long courtId,
            @Param("dateFrom") Instant dateFrom,
            @Param("dateTo") Instant dateTo,
            @Param("userId") UUID userId,
            Pageable pageable
    );

    @Query("SELECT b FROM BookingEntity b " +
            "JOIN b.court court " +
            "LEFT JOIN BookingPlayerEntity bp ON bp.booking.id = b.id " +
            "WHERE (:searchTerm IS NULL OR LOWER(court.name) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "AND (:city IS NULL OR court.city = :city) " +
            "AND (:courtType IS NULL OR court.courtType = :courtType) " +
            "AND (:environment IS NULL OR court.environment = :environment) " +
            "AND (:minPrice IS NULL OR court.price >= :minPrice) " +
            "AND (:maxPrice IS NULL OR court.price <= :maxPrice) " +
            "AND b.status = 'OPEN' " +
            "AND b.user.id != :userId " +
            "AND NOT EXISTS ( " +
            "   SELECT 1 FROM BookingPlayerEntity bpSub " +
            "   WHERE bpSub.booking.id = b.id AND bpSub.user.id = :userId " +
            ")")
    Page<BookingEntity> findFilteredOpenBookingsUser(
            @Param("searchTerm") String searchTerm,
            @Param("city") GreekCity city,
            @Param("courtType") CourtType courtType,
            @Param("environment") CourtEnvironment environment,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            @Param("userId") UUID userId,
            Pageable pageable
    );

    @Query("SELECT b FROM BookingEntity b " +
            "JOIN b.court court " +
            "LEFT JOIN BookingPlayerEntity bp ON bp.booking.id = b.id " +
            "WHERE (:searchTerm IS NULL OR LOWER(CAST(b.notes AS string)) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "AND (:city IS NULL OR court.city = :city) " +
            "AND (:status IS NULL OR b.status = :status) " +
            "AND (:courtType IS NULL OR court.courtType = :courtType) " +
            "AND (:environment IS NULL OR court.environment = :environment) " +
            "AND (bp.user.id = :userId)")
    Page<BookingEntity> findFilteredBookingsUser(
            @Param("searchTerm") String searchTerm,
            @Param("city") GreekCity city,
            @Param("status") BookingStatus status,
            @Param("courtType") CourtType courtType,
            @Param("environment") CourtEnvironment environment,
            @Param("userId") UUID userId,
            Pageable pageable
    );

    @Query("SELECT b FROM BookingEntity b " +
            "WHERE b.status = :status " +
            "AND b.dateTime BETWEEN :now AND :oneHourFromNow")
    List<BookingEntity> findAllByStatusAndDateTimeWithinHour(
            @Param("status") BookingStatus status,
            @Param("now") Instant now,
            @Param("oneHourFromNow") Instant oneHourFromNow
    );

    @Query("SELECT b FROM BookingEntity b " +
            "WHERE b.court.id = :courtId " +
            "AND b.dateTime BETWEEN :startOfDay AND :endOfDay")
    List<BookingEntity> findByCourtIdAndDateRange(
            @Param("courtId") Long courtId,
            @Param("startOfDay") Instant startOfDay,
            @Param("endOfDay") Instant endOfDay);

    List<BookingEntity> findByStatusAndExpirationTimeBefore(BookingStatus status, Instant now);

    @Query("SELECT COUNT(b) FROM BookingEntity b " +
            "LEFT JOIN BookingPlayerEntity bp ON bp.booking.id = b.id " +
            "WHERE bp.user.id = :userId")
    int countBookingByUser(@Param("userId") UUID userId);

    @Query("SELECT COUNT(b) FROM BookingEntity b " +
            "LEFT JOIN BookingPlayerEntity bp ON bp.booking.id = b.id " +
            "WHERE b.status = 'FILLED' AND bp.user.id = :userId")
    int countUpcomingBookings(@Param("userId") UUID userId);

    @Query("SELECT COUNT(b) FROM BookingEntity b " +
            "LEFT JOIN BookingPlayerEntity bp ON bp.booking.id = b.id " +
            "WHERE b.status = 'COMPLETED' AND bp.user.id = :userId")
    int countCompletedBookings(@Param("userId") UUID userId);

    @Query("SELECT COUNT(b) FROM BookingEntity b " +
            "LEFT JOIN BookingPlayerEntity bp ON bp.booking.id = b.id " +
            "WHERE b.status = 'CANCELLED' AND bp.user.id = :userId")
    int countCancelledBookings(@Param("userId") UUID userId);

    @Query("SELECT SUM(p.amountInCents) FROM PaymentEntity p " +
            "LEFT JOIN BookingEntity b ON p.booking.id = b.id " +
            "LEFT JOIN BookingPlayerEntity bp ON bp.booking.id = b.id " +
            "WHERE p.status = 'PAID' " +
            "AND p.user.id = :userId " +
            "AND MONTH(b.dateTime) = MONTH(CURRENT_DATE) " +
            "AND YEAR(b.dateTime) = YEAR(CURRENT_DATE) " +
            "AND (b.status = 'COMPLETED' OR b.status = 'OPEN' OR b.status = 'FILLED') " +
            "AND bp.user.id = :userId")
    Long getThisMonthSpent(@Param("userId") UUID userId);

    @Query("SELECT b FROM BookingEntity b " +
            "LEFT JOIN BookingPlayerEntity bp ON bp.booking.id = b.id " +
            "WHERE (b.status = 'FILLED' OR b.status = 'OPEN') " +
            "AND bp.user.id = :userId AND b.dateTime >= CURRENT_TIMESTAMP " +
            "ORDER BY b.dateTime ASC LIMIT 3 ")
    List<BookingEntity> fetchUpcomingBookings3(@Param("userId") UUID userId);

    @Query("SELECT COUNT(b) FROM BookingEntity b " +
            "LEFT JOIN CourtEntity c ON b.court.id = c.id " +
            "WHERE c.owner.id = :userId")
    int countTotalBookingsAdmin(@Param("userId") UUID userId);

    @Query("SELECT SUM(p.amountInCents) FROM PaymentEntity p " +
            "LEFT JOIN BookingEntity b ON p.booking.id = b.id " +
            "LEFT JOIN CourtEntity c ON b.court.id = c.id " +
            "WHERE p.status = 'PAID' " +
            "AND DAY(b.createdAt) = DAY(CURRENT_DATE) " +
            "AND MONTH(b.createdAt) = MONTH(CURRENT_DATE) " +
            "AND YEAR(b.createdAt) = YEAR(CURRENT_DATE) " +
            "AND (b.status = 'COMPLETED' OR b.status = 'OPEN' OR b.status = 'FILLED') " +
            "AND c.owner.id = :userId")
    Long getTodaysRevenue(@Param("userId") UUID userId);

    @Query("SELECT COUNT(b) FROM BookingEntity b " +
            "LEFT JOIN CourtEntity c ON b.court.id = c.id " +
            "WHERE b.status = 'OPEN' " +
            "AND  c.owner.id = :userId")
    int countOpenBookings(@Param("userId") UUID userId);

    @Query("SELECT b FROM BookingEntity b " +
            "LEFT JOIN CourtEntity c ON b.court.id = c.id " +
            "ORDER BY b.createdAt DESC LIMIT 5 ")
    List<BookingEntity> fetchRecentBookings5(@Param("userId") UUID userId);

    @Query("SELECT b FROM BookingEntity b " +
            "WHERE b.status = 'FILLED' " +
            "AND b.dateTime < CURRENT_TIMESTAMP")
    List<BookingEntity> findAllByStatusAndDateTimePast();
}