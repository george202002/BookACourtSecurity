package com.example.bookacourt.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Availability {
    private DayAvailability monday;
    private DayAvailability tuesday;
    private DayAvailability wednesday;
    private DayAvailability thursday;
    private DayAvailability friday;
    private DayAvailability saturday;
    private DayAvailability sunday;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayAvailability {
        private List<TimePeriod> periods;
        private boolean available;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimePeriod {
        private String startTime;
        private String endTime;
    }
}