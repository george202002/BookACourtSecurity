package com.example.bookacourt.repositories;

import com.example.bookacourt.enums.CourtEnvironment;
import com.example.bookacourt.enums.CourtType;
import com.example.bookacourt.enums.GreekCity;
import com.example.bookacourt.entities.CourtEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CourtRepository extends JpaRepository<CourtEntity, UUID> {

    @Query("SELECT c FROM CourtEntity c " +
            "WHERE (:searchTerm IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "AND (:city IS NULL OR c.city = :city) " +
            "AND (:courtType IS NULL OR c.courtType = :courtType) " +
            "AND (:environment IS NULL OR c.environment = :environment) " +
            "AND (:minPrice IS NULL OR c.price >= :minPrice) " +
            "AND (:maxPrice IS NULL OR c.price <= :maxPrice) " +
            "AND (:userId IS NULL OR c.owner.id = :userId)" +
            "AND (:availableOnly = false OR c.active = true)"
    )
    Page<CourtEntity> findFilteredCourts(
            @Param("searchTerm") String searchTerm,
            @Param("city") GreekCity city,
            @Param("courtType") CourtType courtType,
            @Param("environment") CourtEnvironment environment,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            @Param("userId") UUID userId,
            @Param("availableOnly") boolean availableOnly,
            Pageable pageable
    );

    @Query("SELECT COUNT(c) FROM CourtEntity c " +
            "WHERE c.owner.id = :userId")
    int countActiveCourts(@Param("userId") UUID userId);
}