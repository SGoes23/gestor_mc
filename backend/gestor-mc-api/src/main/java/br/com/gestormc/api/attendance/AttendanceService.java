package br.com.gestormc.api.attendance;

import br.com.gestormc.api.auth.AppUser;
import br.com.gestormc.api.event.Event;
import br.com.gestormc.api.event.EventRepository;
import br.com.gestormc.api.event.EventEligibilitySnapshotRepository;
import br.com.gestormc.api.member.Member;
import br.com.gestormc.api.member.MemberRepository;
import br.com.gestormc.api.member.MemberStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EventRepository eventRepository;
    private final MemberRepository memberRepository;
    private final EventEligibilitySnapshotRepository eligibilitySnapshotRepository;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             EventRepository eventRepository,
                             MemberRepository memberRepository,
                             EventEligibilitySnapshotRepository eligibilitySnapshotRepository) {
        this.attendanceRepository = attendanceRepository;
        this.eventRepository = eventRepository;
        this.memberRepository = memberRepository;
        this.eligibilitySnapshotRepository = eligibilitySnapshotRepository;
    }

    @Transactional(readOnly = true)
    public List<AttendanceController.AttendanceResponse> listByEvent(Long eventId) {
        requireEvent(eventId);
        List<Attendance> records = attendanceRepository.findByEventId(eventId);
        Map<Long, Attendance> byMember = new LinkedHashMap<>();
        records.stream()
                .sorted((left, right) -> left.getMember().getFullName().compareToIgnoreCase(right.getMember().getFullName()))
                .forEach(record -> byMember.put(record.getMember().getId(), record));

        Map<Long, Member> members = new LinkedHashMap<>();
        memberRepository.findByStatusOrderByFullNameAsc(MemberStatus.ATIVO)
                .forEach(member -> members.put(member.getId(), member));
        records.forEach(record -> members.putIfAbsent(record.getMember().getId(), record.getMember()));

        return members.values().stream()
                .map(member -> toResponse(member, byMember.get(member.getId())))
                .toList();
    }

    @Transactional
    public List<AttendanceController.AttendanceResponse> save(Long eventId,
                                                               List<AttendanceController.AttendanceItemRequest> items,
                                                               AppUser checkedBy) {
        Event event = requireEvent(eventId);
        if (event.getEventDate().isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A presenca so pode ser registrada no dia do evento ou depois dele");
        }

        for (AttendanceController.AttendanceItemRequest item : items) {
            Member member = memberRepository.findById(item.memberId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Membro nao encontrado: " + item.memberId()));
            Attendance attendance = attendanceRepository.findByEventIdAndMemberId(eventId, item.memberId())
                    .orElseGet(() -> new Attendance(event, member, AttendanceStatus.NAO_REGISTRADO));
            attendance.update(item.status(), item.notes(), checkedBy);
            attendanceRepository.save(attendance);
        }
        return listByEvent(eventId);
    }

    @Transactional(readOnly = true)
    public List<AttendanceController.EventAttendanceSummary> eventSummaries(LocalDate from, LocalDate to) {
        return eventRepository.findByEventDateLessThanEqualOrderByEventDateDesc(LocalDate.now()).stream()
                .filter(event -> from == null || !event.getEventDate().isBefore(from))
                .filter(event -> to == null || !event.getEventDate().isAfter(to))
                .map(event -> toSummary(
                        event,
                        attendanceRepository.findByEventId(event.getId()),
                        eligibleMembersFor(event.getId())
                ))
                .toList();
    }

    private int eligibleMembersFor(Long eventId) {
        return eligibilitySnapshotRepository.findByEventId(eventId)
                .map(snapshot -> snapshot.getEligibleMembersCount())
                .orElseGet(() -> Math.toIntExact(memberRepository.countByStatus(MemberStatus.ATIVO)));
    }

    private Event requireEvent(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento nao encontrado"));
    }

    private AttendanceController.AttendanceResponse toResponse(Member member, Attendance attendance) {
        return new AttendanceController.AttendanceResponse(
                member.getId(),
                member.getFullName(),
                member.getNickname(),
                member.getRole(),
                member.getStatus(),
                attendance == null ? AttendanceStatus.NAO_REGISTRADO : attendance.getStatus(),
                attendance == null ? null : attendance.getNotes(),
                attendance == null ? null : attendance.getCheckedAt(),
                attendance == null || attendance.getCheckedBy() == null ? null : attendance.getCheckedBy().getEmail()
        );
    }

    private AttendanceController.EventAttendanceSummary toSummary(Event event, List<Attendance> records,
                                                                    int totalMembers) {
        long present = count(records, AttendanceStatus.PRESENTE);
        long absent = count(records, AttendanceStatus.AUSENTE);
        long justified = count(records, AttendanceStatus.JUSTIFICADO);
        long recorded = present + absent + justified;
        long pending = Math.max(0, totalMembers - recorded);
        double rate = recorded == 0 ? 0 : Math.round((present * 10000.0) / recorded) / 100.0;
        return new AttendanceController.EventAttendanceSummary(
                event.getId(), event.getTitle(), event.getType(), event.getEventDate(), event.getPlace(),
                totalMembers, present, absent, justified, pending, rate
        );
    }

    private long count(List<Attendance> records, AttendanceStatus status) {
        return records.stream().filter(record -> record.getStatus() == status).count();
    }
}
