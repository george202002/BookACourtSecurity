package com.example.bookacourt.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingPlayerRequest {
    private UUID userId;
    private String playerName;
    private String playerEmail;
    private String playerPhone;
    private UUID addedBy;
    private boolean lastAdded;
}
