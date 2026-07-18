package com.example.bookacourt.repositories;

import com.example.bookacourt.entities.PaymentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<PaymentEntity, UUID> {
    Page<PaymentEntity> findByUserId(UUID userId, Pageable pageable);
    List<PaymentEntity> findAllByBookingId(UUID bookingId);
}