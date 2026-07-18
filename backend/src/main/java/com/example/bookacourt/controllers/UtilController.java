package com.example.bookacourt.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/utils")
public class UtilController {

    private static final Logger log = LoggerFactory.getLogger(UtilController.class);

    @GetMapping("/ping")
    public ResponseEntity<?> ping(@RequestParam(name = "host", defaultValue = "localhost") String host) {
        try {
            String command = "ping -c 1 " + host;
            log.info("Running diagnostic command: {}", command);

            Process process = new ProcessBuilder("sh", "-c", command)
                    .redirectErrorStream(true)
                    .start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }
            process.waitFor();
            return ResponseEntity.ok(output.toString());
        } catch (Exception e) {
            log.error("Error running ping", e);
            return ResponseEntity.badRequest().body("Error running ping: " + e.getMessage());
        }
    }
}
