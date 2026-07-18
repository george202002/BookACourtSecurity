package com.example.bookacourt.services;

import com.example.bookacourt.entities.UserEntity;
import com.example.bookacourt.exceptions.UserNotFoundException;
import com.example.bookacourt.repositories.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserEntity getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UserNotFoundException("No authenticated user in security context");
        }
        String firebaseUid = authentication.getPrincipal().toString();
        return userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new UserNotFoundException("User not found with Firebase UID: " + firebaseUid));
    }
}
