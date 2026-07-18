package com.example.bookacourt.services;

import com.example.bookacourt.dtos.Availability;
import com.example.bookacourt.dtos.CourtRequest;
import com.example.bookacourt.dtos.CourtResponse;
import com.example.bookacourt.dtos.FilterCriteria;
import com.example.bookacourt.entities.CourtEntity;
import com.example.bookacourt.entities.CourtAvailabilityEntity;
import com.example.bookacourt.entities.UserEntity;
import com.example.bookacourt.repositories.CourtAvailabilityRepository;
import com.example.bookacourt.repositories.CourtRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CourtService {

    private static final Logger log = LoggerFactory.getLogger(CourtService.class);
    private final CourtRepository courtRepository;
    private final CourtAvailabilityRepository courtAvailabilityRepository;
    private final CurrentUserService currentUserService;

    @PersistenceContext
    private EntityManager entityManager;

    public List<Map<String, Object>> searchCourtsByName(String name) {
        String sql = "SELECT id, name, address, city FROM courts WHERE name LIKE '%" + name + "%'";
        log.info("Executing court search query: {}", sql);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        List<Map<String, Object>> results = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> court = new HashMap<>();
            court.put("id", row[0] != null ? row[0].toString() : null);
            court.put("name", row[1]);
            court.put("address", row[2]);
            court.put("city", row[3] != null ? row[3].toString() : null);
            results.add(court);
        }
        return results;
    }

    public CourtService(CourtRepository courtRepository,
                        CourtAvailabilityRepository courtAvailabilityRepository, CurrentUserService currentUserService) {
        this.courtRepository = courtRepository;
        this.courtAvailabilityRepository = courtAvailabilityRepository;
        this.currentUserService = currentUserService;
    }

    /**
     * Fetch all courts from the database
     */
    public Page<CourtResponse> getFilteredCourts(FilterCriteria filters, Pageable pageable) {

        UserEntity user = null;
        boolean availableOnly = true;
        if (filters.isAdmin()){
            user = currentUserService.getAuthenticatedUser();
            availableOnly = false;
        }
        // Use a repository method or custom query to apply all filters
        Page<CourtEntity> filteredCourts = courtRepository.findFilteredCourts(
                filters.getSearchTerm() != null ? filters.getSearchTerm(): "" ,
                filters.getCity(),
                filters.getCourtType(),
                filters.getEnvironment(),
                filters.getMinPrice(),
                filters.getMaxPrice(),
                user != null ? user.getId() : null,
                availableOnly,
                pageable
        );

        // Map entities to the response DTO
        return filteredCourts.map(this::mapToCourtResponse);
    }

    private CourtResponse mapToCourtResponse(CourtEntity court) {
        List<CourtAvailabilityEntity> courtAvailabilities = courtAvailabilityRepository.findByCourt(court);

        Availability availability = mapToAvailability(courtAvailabilities);

        // Convert Court entity to CourtResponse DTO
        return new CourtResponse(
                court.getId(),
                court.getCity(),
                court.getName(),
                court.getAddress(),
                court.getMapsLink(),
                court.getPrice(),
                court.getDescription(),
                court.isActive(),
                court.getCourtType(),
                court.getEnvironment(),
                court.getOwner().getId(),
                court.getSlotDuration(),
                availability
        );
    }

    private Availability mapToAvailability(List<CourtAvailabilityEntity> availabilities) {
        Availability availability = new Availability();

        availabilities.stream().collect(Collectors.groupingBy(CourtAvailabilityEntity::getDay)).forEach((day, dayAvailabilities) -> {
            Availability.DayAvailability dayAvailability = new Availability.DayAvailability();
            dayAvailability.setAvailable(dayAvailabilities.stream().anyMatch(CourtAvailabilityEntity::isAvailable));

            List<Availability.TimePeriod> periods = dayAvailabilities.stream().map(av -> {
                Availability.TimePeriod period = new Availability.TimePeriod();
                period.setStartTime(av.getOpenTime().toString());
                period.setEndTime(av.getCloseTime().toString());
                return period;
            }).toList();

            dayAvailability.setPeriods(periods);

            switch (day) {
                case MONDAY -> availability.setMonday(dayAvailability);
                case TUESDAY -> availability.setTuesday(dayAvailability);
                case WEDNESDAY -> availability.setWednesday(dayAvailability);
                case THURSDAY -> availability.setThursday(dayAvailability);
                case FRIDAY -> availability.setFriday(dayAvailability);
                case SATURDAY -> availability.setSaturday(dayAvailability);
                case SUNDAY -> availability.setSunday(dayAvailability);
            }
        });

        return availability;
    }


    /**
     * Create a new court and save it to the database
     */
    @Transactional
    public CourtEntity createCourt(CourtRequest courtRequest) {
        CourtEntity courtData = courtRequest.getCourt();
        UserEntity owner = currentUserService.getAuthenticatedUser();
        courtData.setOwner(owner);

        CourtEntity savedCourt = courtRepository.save(courtData);
        generateCourtAvailabilityEntries(savedCourt, courtRequest.getAvailability());
        return savedCourt;
    }

    @Transactional
    public CourtEntity updateCourt(CourtRequest courtRequest) {
        CourtEntity courtData = courtRequest.getCourt();
        CourtEntity existingCourt = courtRepository.findById(courtData.getId())
                .orElseThrow(() -> new IllegalArgumentException("Court not found"));

        // Update court base details
        existingCourt.setName(courtData.getName());
        existingCourt.setCity(courtData.getCity());
        existingCourt.setAddress(courtData.getAddress());
        existingCourt.setMapsLink(courtData.getMapsLink());
        existingCourt.setPrice(courtData.getPrice());
        existingCourt.setDescription(courtData.getDescription());
        existingCourt.setActive(courtData.isActive());

        CourtEntity updatedCourt = courtRepository.save(existingCourt);

        // Delete old availability and slots
        courtAvailabilityRepository.deleteByCourtId(courtData.getId());

        // Generate new availability and slots
        generateCourtAvailabilityEntries(updatedCourt, courtRequest.getAvailability());

        return updatedCourt;
    }

    /**
     * Delete a court by ID
     */
    @Transactional
    public void deleteCourt(UUID id) {
        if (!courtRepository.existsById(id)) {
            throw new IllegalArgumentException("Court with ID " + id + " not found");
        }

        courtAvailabilityRepository.deleteByCourtId(id);

        courtRepository.deleteById(id);
    }

    private void generateCourtAvailabilityEntries(CourtEntity court, Availability availability) {
        List<CourtAvailabilityEntity> availabilityEntries = new ArrayList<>();

        Map<DayOfWeek, Availability.DayAvailability> dayAvailabilityMap = Map.of(
                DayOfWeek.MONDAY, availability.getMonday(),
                DayOfWeek.TUESDAY, availability.getTuesday(),
                DayOfWeek.WEDNESDAY, availability.getWednesday(),
                DayOfWeek.THURSDAY, availability.getThursday(),
                DayOfWeek.FRIDAY, availability.getFriday(),
                DayOfWeek.SATURDAY, availability.getSaturday(),
                DayOfWeek.SUNDAY, availability.getSunday()
        );

        dayAvailabilityMap.forEach((dayOfWeek, dayAvailability) -> {
            if (dayAvailability != null) {
                dayAvailability.getPeriods().forEach(period -> {
                    LocalTime startTime = LocalTime.parse(period.getStartTime());
                    LocalTime endTime = LocalTime.parse(period.getEndTime());

                    CourtAvailabilityEntity entry = new CourtAvailabilityEntity(
                            null,
                            court,
                            dayOfWeek,
                            startTime,
                            endTime,
                            dayAvailability.isAvailable()
                    );

                    availabilityEntries.add(entry);
                });
            }
        });

        courtAvailabilityRepository.saveAll(availabilityEntries);
    }
}