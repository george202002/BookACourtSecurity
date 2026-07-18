package com.example.bookacourt.dtos.auth;

import lombok.Data;

@Data
public class AuthRequestDto {
    private String firebaseToken; // coming from React
    private String firstName;
    private String lastName;
    private String phoneNumber;
}
