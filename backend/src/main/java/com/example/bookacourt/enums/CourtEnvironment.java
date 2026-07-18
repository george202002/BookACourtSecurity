package com.example.bookacourt.enums;

import lombok.Getter;

@Getter
public enum CourtEnvironment {
    Indoor("Indoor"),
    Outdoor("Outdoor");

    private final String displayName;

    CourtEnvironment(String displayName) {
        this.displayName = displayName;
    }

}