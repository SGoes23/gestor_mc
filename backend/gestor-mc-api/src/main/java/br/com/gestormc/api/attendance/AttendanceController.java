package br.com.gestormc.api.attendance;

import br.com.gestormc.api.auth.AppUser;
import br.com.gestormc.api.event.EventType;
import br.com.gestormc.api.member.MemberStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@RestController
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping("/api/events/{eventId}/attendances")
    public List<AttendanceResponse> listByEvent(@PathVariable Long eventId) {
        return attendanceService.listByEvent(eventId);
    }

    @PutMapping("/api/events/{eventId}/attendances")
    public List<AttendanceResponse> save(@PathVariable Long eventId,
                                         @RequestBody @Valid SaveAttendancesRequest request,
                                         Authentication authentication) {
        return attendanceService.save(eventId, request.attendances(), (AppUser) authentication.getPrincipal());
    }

    @GetMapping("/api/attendances/events")
    public List<EventAttendanceSummary> eventSummaries(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return attendanceService.eventSummaries(from, to);
    }

    public record SaveAttendancesRequest(
            @NotNull List<@Valid AttendanceItemRequest> attendances
    ) {
    }

    public record AttendanceItemRequest(
            @NotNull Long memberId,
            @NotNull AttendanceStatus status,
            @Size(max = 500) String notes
    ) {
    }

    public record AttendanceResponse(
            Long memberId,
            String memberFullName,
            String memberNickname,
            String memberRole,
            MemberStatus memberStatus,
            AttendanceStatus status,
            String notes,
            Instant checkedAt,
            String checkedBy
    ) {
    }

    public record EventAttendanceSummary(
            Long eventId,
            String eventTitle,
            EventType eventType,
            LocalDate eventDate,
            String place,
            int totalMembers,
            long present,
            long absent,
            long justified,
            long pending,
            double attendanceRate
    ) {
    }
}
