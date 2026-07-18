package com.example.bookacourt.services;

import com.example.bookacourt.dtos.auth.AuthRequestDto;
import com.example.bookacourt.dtos.auth.AuthResponseDto;
import com.example.bookacourt.entities.UserEntity;
import com.example.bookacourt.exceptions.DuplicateEmailException;
import com.example.bookacourt.exceptions.DuplicatePhoneNumberException;
import com.example.bookacourt.exceptions.InvalidInputException;
import com.example.bookacourt.exceptions.UserExistsException;
import com.example.bookacourt.exceptions.UserNotFoundException;
import com.example.bookacourt.repositories.UserRepository;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private FirebaseAuth firebaseAuth() {
        return FirebaseAuth.getInstance();
    }

    @Transactional
    public AuthResponseDto register(AuthRequestDto request) throws Exception {

        FirebaseToken decodedToken = firebaseAuth().verifyIdToken(request.getFirebaseToken());

        String uid = decodedToken.getUid();
        String email = decodedToken.getEmail();

        if (userRepository.findByFirebaseUid(uid).isPresent()) {
            throw new UserExistsException("User already exists");
        }

        try {
            validateRegistrationInput(request);

            if (userRepository.findByEmail(email).isPresent()) {
                throw new DuplicateEmailException("Email is already in use: " + email);
            }

            if (userRepository.findByPhone(request.getPhoneNumber()).isPresent()) {
                throw new DuplicatePhoneNumberException("Phone number is already in use: " + request.getPhoneNumber());
            }

            UserEntity newUser = new UserEntity();
            newUser.setFirebaseUid(uid);
            newUser.setEmail(email);
            newUser.setFirstName(request.getFirstName());
            newUser.setLastName(request.getLastName());
            newUser.setPhone(request.getPhoneNumber());
            newUser.setRole("USER");

            userRepository.save(newUser);

            return getAuthResponseDto(uid, newUser);
        } catch (Exception e) {
            rollbackFirebaseUser(decodedToken);
            throw e;
        }
    }

    private void rollbackFirebaseUser(FirebaseToken decodedToken) {
        if (!isPasswordProvider(decodedToken)) {
            return;
        }
        try {
            firebaseAuth().deleteUser(decodedToken.getUid());
            log.info("Rolled back Firebase user {} after failed registration", decodedToken.getUid());
        } catch (Exception e) {
            log.error("Failed to roll back Firebase user {} after failed registration", decodedToken.getUid(), e);
        }
    }

    private boolean isPasswordProvider(FirebaseToken decodedToken) {
        Object firebaseClaim = decodedToken.getClaims().get("firebase");
        if (firebaseClaim instanceof Map<?, ?> claim) {
            return "password".equals(claim.get("sign_in_provider"));
        }
        return false;
    }

    public AuthResponseDto login(AuthRequestDto request) throws Exception {

        FirebaseToken decodedToken = firebaseAuth().verifyIdToken(request.getFirebaseToken());

        String uid = decodedToken.getUid();

        UserEntity user = userRepository.findByFirebaseUid(uid)
                .orElseThrow(() -> new UserNotFoundException("User does not exist"));

        return getAuthResponseDto(uid, user);
    }

    private void validateRegistrationInput(AuthRequestDto request) {
        if (request.getFirstName() == null || request.getFirstName().isBlank()) {
            throw new InvalidInputException("First name is required");
        }
        if (request.getLastName() == null || request.getLastName().isBlank()) {
            throw new InvalidInputException("Last name is required");
        }
        if (request.getPhoneNumber() == null || request.getPhoneNumber().isBlank()) {
            throw new InvalidInputException("Phone number is required");
        }
    }

    private AuthResponseDto getAuthResponseDto(String uid, UserEntity user) {
        AuthResponseDto dto = new AuthResponseDto();
        dto.setFirebaseUid(uid);
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFirstName() + " " + user.getLastName());
        dto.setPhoneNumber(user.getPhone());
        dto.setRole(user.getRole());
        dto.setEmailVerified(user.isEmailVerified());
        return dto;
    }
}
