package com.example.bookacourt.enums;

import lombok.Getter;

@Getter
public enum CourtType {
    Padel("Padel"),
    Tennis("Tennis"),
    Basketball("Basketball"),
    Football("Football");

    private final String displayName;

    CourtType(String displayName) {
        this.displayName = displayName;
    }

}