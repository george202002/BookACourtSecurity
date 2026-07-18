package com.example.bookacourt.config;

import com.example.bookacourt.entities.CourtEntity;
import com.example.bookacourt.entities.UserEntity;
import com.example.bookacourt.enums.CourtEnvironment;
import com.example.bookacourt.enums.CourtType;
import com.example.bookacourt.enums.GreekCity;
import com.example.bookacourt.repositories.CourtRepository;
import com.example.bookacourt.repositories.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CourtRepository courtRepository;

    public DataSeeder(UserRepository userRepository, CourtRepository courtRepository) {
        this.userRepository = userRepository;
        this.courtRepository = courtRepository;
    }

    @Override
    public void run(String... args) {
        if (courtRepository.count() > 0) {
            return;
        }

        UserEntity owner = userRepository.findByEmail("owner@bookacourt.local")
                .orElseGet(() -> {
                    UserEntity u = new UserEntity();
                    u.setFirebaseUid("seed-owner-uid");
                    u.setEmail("owner@bookacourt.local");
                    u.setFirstName("Court");
                    u.setLastName("Owner");
                    u.setPhone("+302100000000");
                    u.setEmailVerified(true);
                    u.setRole("ADMIN");
                    return userRepository.save(u);
                });

        courtRepository.saveAll(List.of(
                court(owner, "Downtown Padel Club", GreekCity.Athens, "12 Ermou St",
                        CourtType.Padel, CourtEnvironment.Indoor, 24.0),
                court(owner, "Riverside Tennis Center", GreekCity.Thessaloniki, "5 Nikis Ave",
                        CourtType.Tennis, CourtEnvironment.Outdoor, 18.0),
                court(owner, "Seaside Padel Arena", GreekCity.Piraeus, "8 Akti Miaouli",
                        CourtType.Padel, CourtEnvironment.Outdoor, 22.0),
                court(owner, "Olympus Basketball Hall", GreekCity.Larissa, "30 Kyprou St",
                        CourtType.Basketball, CourtEnvironment.Indoor, 15.0),
                court(owner, "Old Town Football Pitch", GreekCity.Patras, "3 Agiou Nikolaou",
                        CourtType.Football, CourtEnvironment.Outdoor, 40.0),
                court(owner, "Central Padel Point", GreekCity.Heraklion, "21 Dikaiosynis Ave",
                        CourtType.Padel, CourtEnvironment.Indoor, 20.0)
        ));
    }

    private CourtEntity court(UserEntity owner, String name, GreekCity city, String address,
                             CourtType type, CourtEnvironment env, double price) {
        CourtEntity c = new CourtEntity();
        c.setOwner(owner);
        c.setName(name);
        c.setCity(city);
        c.setAddress(address);
        c.setMapsLink("https://maps.example.com/" + name.replace(" ", "-"));
        c.setPrice(price);
        c.setDescription(name + " — booking available.");
        c.setActive(true);
        c.setCourtType(type);
        c.setEnvironment(env);
        c.setSlotDuration(60.0);
        return c;
    }
}
