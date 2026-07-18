package com.example.bookacourt.dtos.auth;

import lombok.Data;

@Data
public class AuthResponseDto {
    private String firebaseUid;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String role;
    private String subscription;
    private boolean emailVerified;
}
