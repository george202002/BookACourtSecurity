package com.example.bookacourt.controllers;

import com.example.bookacourt.dtos.SupportRequest;
import com.example.bookacourt.services.SupportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/support")
public class SupportController {

    private static final Logger log = LoggerFactory.getLogger(SupportController.class);
    private final SupportService supportService;

    public SupportController(SupportService supportService) {
        this.supportService = supportService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @PostMapping("/submit")
    public ResponseEntity<?> submitSupportRequest(@RequestBody SupportRequest supportRequest) {
        try {
            log.info("Received support request from: {}", supportRequest.getEmail());
            supportService.sendSupportRequest(supportRequest);
            log.info("Support request successfully handled for: {}", supportRequest.getEmail());
            return ResponseEntity.ok("Support request submitted successfully");
        } catch (Exception e) {
            log.error("Error handling support request for: {}", supportRequest.getEmail(), e);
            return ResponseEntity.status(500).body("Failed to submit support request: " + e.getMessage());
        }
    }
}