package com.example.bookacourt.services;

import com.example.bookacourt.dtos.SupportRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class SupportService {

    private static final Logger log = LoggerFactory.getLogger(SupportService.class);
    private final EmailService emailService;

    public SupportService(EmailService emailService) {
        this.emailService = emailService;
    }

    public void sendSupportRequest(SupportRequest supportRequest) {
        try {
            String subject = String.format("Support Request: %s (%s)", supportRequest.getSubject(), supportRequest.getCategory());
            String message = String.format(
                    "Name: %s\nEmail: %s\nSubject: %s\nCategory: %s\n\nMessage:\n%s",
                    supportRequest.getName(),
                    supportRequest.getEmail(),
                    supportRequest.getSubject(),
                    supportRequest.getCategory(),
                    supportRequest.getMessage()
            );

            log.info("Sending support request email to: support@bookacourt.local");
            emailService.send("support@bookacourt.local", subject, message);
            log.info("Support request email successfully sent to: support@bookacourt.local");
        } catch (Exception e) {
            log.error("Failed to send support request email for: {}", supportRequest.getEmail(), e);
            throw new RuntimeException("Failed to process support request", e);
        }
    }
}