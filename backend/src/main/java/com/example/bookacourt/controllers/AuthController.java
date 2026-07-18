package com.example.bookacourt.controllers;

import com.example.bookacourt.dtos.auth.AuthRequestDto;
import com.example.bookacourt.dtos.auth.AuthResponseDto;
import com.example.bookacourt.exceptions.DuplicateEmailException;
import com.example.bookacourt.exceptions.DuplicatePhoneNumberException;
import com.example.bookacourt.exceptions.InvalidInputException;
import com.example.bookacourt.exceptions.UserExistsException;
import com.example.bookacourt.exceptions.UserNotFoundException;
import com.example.bookacourt.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(
            @RequestBody AuthRequestDto request) {
        try {
            log.info("User register attempt");

            AuthResponseDto response = authService.register(request);

            return ResponseEntity.ok(response);
        } catch (InvalidInputException e) {
            log.warn("Invalid registration input: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (UserExistsException | DuplicateEmailException | DuplicatePhoneNumberException e) {
            log.warn("Registration conflict: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("Error during registration:", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(
            @RequestBody AuthRequestDto request) {
        try {
            log.info("User login attempt: {}", request.getFirebaseToken());

            AuthResponseDto response = authService.login(request);

            return ResponseEntity.ok(response);
        } catch (UserNotFoundException e) {
            log.warn("Login failed, user not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error during login:", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}
