package com.example.bookacourt.dtos;

import com.example.bookacourt.entities.CourtEntity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourtRequest {
    private CourtEntity court;
    private Availability availability;
}