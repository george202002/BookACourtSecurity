package com.example.bookacourt.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ResourceLoader;

import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.service.account:classpath:firebase-service-account.json}")
    private String serviceAccountLocation;

    private final ResourceLoader resourceLoader;

    public FirebaseConfig(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(FirebaseConfig.class);

    @PostConstruct
    public void initialize() {
        // Firebase is optional; the app boots without it (e.g. in CI / security testing) when
        // no service account is available. Auth-protected endpoints simply won't authenticate.
        if (serviceAccountLocation == null || serviceAccountLocation.isBlank()) {
            log.warn("Firebase service account not configured — starting without Firebase authentication.");
            return;
        }
        try (InputStream serviceAccount = resourceLoader.getResource(serviceAccountLocation).getInputStream()) {

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
            log.info("Firebase initialized from '{}'.", serviceAccountLocation);
        } catch (Exception e) {
            log.warn("Could not initialize Firebase from '{}' ({}). Continuing without Firebase.",
                    serviceAccountLocation, e.getMessage());
        }
    }
}
