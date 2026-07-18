package com.example.bookacourt.controllers;

import com.example.bookacourt.dtos.CourtRequest;
import com.example.bookacourt.dtos.CourtResponse;
import com.example.bookacourt.dtos.FilterCriteria;
import com.example.bookacourt.entities.CourtEntity;
import com.example.bookacourt.services.CourtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/courts")
public class CourtController {

    private static final Logger log = LoggerFactory.getLogger(CourtController.class);

    private final CourtService courtService;

    public CourtController(CourtService courtService) {
        this.courtService = courtService;
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchCourts(@RequestParam(name = "name", defaultValue = "") String name) {
        try {
            List<Map<String, Object>> courts = courtService.searchCourtsByName(name);
            return ResponseEntity.ok(courts);
        } catch (Exception e) {
            log.error("Error searching courts", e);
            return ResponseEntity.badRequest().body("Error searching courts: " + e.getMessage());
        }
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @PostMapping("/filter")
    public ResponseEntity<?> getCourts(
            @RequestBody FilterCriteria filters,
            Pageable pageable
    ) {
        try{
            log.info("Fetching courts with filters: {}", filters);
            Page<CourtResponse> paginatedCourts = courtService.getFilteredCourts(filters, pageable);
            return ResponseEntity.ok(paginatedCourts);
        }catch (Exception e){
            log.error("Error getting courts", e);
            return ResponseEntity.badRequest().body("Error getting courts: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<?> createCourt(@RequestBody CourtRequest courtRequest) {
        try {
            log.info("Creating a new court with name: {}", courtRequest.getCourt().getName());
            CourtEntity createdCourt = courtService.createCourt(courtRequest);
            return ResponseEntity.ok(createdCourt);
        } catch (Exception e) {
            log.error("Error creating court", e);
            return ResponseEntity.badRequest().body("Error creating court: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCourt(@PathVariable UUID id, @RequestBody CourtRequest courtRequest) {
        try {
            log.info("Updating court with ID: {}", id);
            CourtEntity updatedCourt = courtService.updateCourt(courtRequest);
            return ResponseEntity.ok(updatedCourt);
        } catch (Exception e) {
            log.error("Error updating court", e);
            return ResponseEntity.badRequest().body("Error updating court: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourt(@PathVariable UUID id) {
        try {
            log.info("Deleting court with ID: {}", id);
            courtService.deleteCourt(id);
            return ResponseEntity.ok("Court deleted successfully");
        } catch (Exception e) {
            log.error("Error deleting court with ID: {}", id, e);
            return ResponseEntity.badRequest().body("Error deleting court: " + e.getMessage());
        }
    }
}