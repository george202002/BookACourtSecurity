package com.example.bookacourt.repositories;

import com.example.bookacourt.entities.CourtEntity;
import com.example.bookacourt.entities.CourtAvailabilityEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourtAvailabilityRepository extends JpaRepository<CourtAvailabilityEntity, UUID> {
    List<CourtAvailabilityEntity> findByCourt(CourtEntity court);
    void deleteByCourtId(UUID courtId);
}