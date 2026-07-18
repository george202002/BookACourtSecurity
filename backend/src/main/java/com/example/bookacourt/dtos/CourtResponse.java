package com.example.bookacourt.dtos;

import com.example.bookacourt.enums.CourtEnvironment;
import com.example.bookacourt.enums.CourtType;
import com.example.bookacourt.enums.GreekCity;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class CourtResponse {
    private UUID id;
    private GreekCity city;
    private String name;
    private String address;
    private String mapsLink;
    private Double price;
    private String description;
    private boolean active;
    private CourtType courtType;
    private CourtEnvironment environment;
    private UUID ownerId;
    private Double slotDuration;
    private Availability availability;
}


