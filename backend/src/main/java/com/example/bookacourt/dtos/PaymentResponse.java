package com.example.bookacourt.dtos;

import com.example.bookacourt.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class PaymentResponse {
    private UUID id;
    private UUID bookingId;
    private UUID userId;
    private Long amount;
    private PaymentStatus status;
    private String courtName;
    private String createdAt;
    private String updatedAt;
}