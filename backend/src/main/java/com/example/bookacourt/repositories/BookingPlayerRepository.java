package com.example.bookacourt.repositories;

import com.example.bookacourt.entities.BookingPlayerEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookingPlayerRepository extends JpaRepository<BookingPlayerEntity, UUID> {

    List<BookingPlayerEntity> findByBookingId(UUID bookingId);

    List<BookingPlayerEntity> findByUserId(UUID userId);

    Optional<BookingPlayerEntity> findByUserIdAndBookingId(UUID userId, UUID bookingId);

    List<BookingPlayerEntity> findByAddedByIdAndBookingId(UUID addedById, UUID bookingId);
}
