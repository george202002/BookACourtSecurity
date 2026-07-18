package com.example.bookacourt.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SupportRequest {
    private String name;
    private String email;
    private String subject;
    private String category;
    private String message;
}