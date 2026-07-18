package com.example.bookacourt.dtos;

import com.example.bookacourt.enums.BookingStatus;
import com.example.bookacourt.enums.CourtEnvironment;
import com.example.bookacourt.enums.CourtType;
import com.example.bookacourt.enums.GreekCity;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class FilterCriteria {
    private String searchTerm;
    private BookingStatus status;
    private GreekCity city;
    private CourtType courtType;
    private CourtEnvironment environment;
    private Double minPrice;
    private Double maxPrice;
    private Long courtId;
    private Instant dateFrom;
    private Instant dateTo;
    private boolean admin;
}

