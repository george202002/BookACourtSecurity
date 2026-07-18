package com.example.bookacourt.dtos;

import com.example.bookacourt.enums.BookingStatus;
import com.example.bookacourt.entities.CourtEntity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingDTO {
    private UUID id;
    private CourtEntity court;
    private Instant dateTime;
    private UserResponse user;
    private BookingStatus status;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}

