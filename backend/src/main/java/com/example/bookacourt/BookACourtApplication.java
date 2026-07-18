package com.example.bookacourt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BookACourtApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookACourtApplication.class, args);
    }

}
