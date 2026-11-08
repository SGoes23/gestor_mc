package br.com.gestormc.api.attendance;

import br.com.gestormc.api.auth.AccessProfile;
import br.com.gestormc.api.auth.AppUser;
import br.com.gestormc.api.event.Event;
import br.com.gestormc.api.event.EventRepository;
import br.com.gestormc.api.event.EventEligibilitySnapshot;
import br.com.gestormc.api.event.EventEligibilitySnapshotRepository;
import br.com.gestormc.api.event.EventType;
import br.com.gestormc.api.member.Member;
import br.com.gestormc.api.member.MemberRepository;
import br.com.gestormc.api.member.MemberStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AttendanceServiceTest {

    private AttendanceRepository attendanceRepository;
    private EventRepository eventRepository;
    private MemberRepository memberRepository;
    private EventEligibilitySnapshotRepository eligibilitySnapshotRepository;
    private AttendanceService service;

    @BeforeEach
    void setUp() {
        attendanceRepository = mock(AttendanceRepository.class);
        eventRepository = mock(EventRepository.class);
        memberRepository = mock(MemberRepository.class);
        eligibilitySnapshotRepository = mock(EventEligibilitySnapshotRepository.class);
        service = new AttendanceService(
                attendanceRepository,
                eventRepository,
                memberRepository,
                eligibilitySnapshotRepository
        );
    }

    @Test
    void listsEveryActiveMemberAsPendingWhenAttendanceWasNotRegistered() {
        Event event = event(LocalDate.now());
        Member member = member(7L, "Maria Silva", "Maria");
        when(eventRepository.findById(10L)).thenReturn(Optional.of(event));
        when(attendanceRepository.findByEventId(10L)).thenReturn(List.of());
        when(memberRepository.findByStatusOrderByFullNameAsc(MemberStatus.ATIVO)).thenReturn(List.of(member));

        var result = service.listByEvent(10L);

        assertThat(result).singleElement().satisfies(item -> {
            assertThat(item.memberId()).isEqualTo(7L);
            assertThat(item.memberFullName()).isEqualTo("Maria Silva");
            assertThat(item.status()).isEqualTo(AttendanceStatus.NAO_REGISTRADO);
            assertThat(item.checkedAt()).isNull();
        });
    }

    @Test
    void savesAttendanceWithNotesAndAuditUser() {
        Event event = event(LocalDate.now());
        Member member = member(7L, "Maria Silva", "Maria");
        AppUser director = new AppUser("diretoria@gestormc.local", "hash", AccessProfile.DIRETORIA);
        when(eventRepository.findById(10L)).thenReturn(Optional.of(event));
        when(memberRepository.findById(7L)).thenReturn(Optional.of(member));
        when(attendanceRepository.findByEventIdAndMemberId(10L, 7L)).thenReturn(Optional.empty());
        when(attendanceRepository.findByEventId(10L)).thenReturn(List.of());
        when(memberRepository.findByStatusOrderByFullNameAsc(MemberStatus.ATIVO)).thenReturn(List.of(member));

        service.save(10L, List.of(new AttendanceController.AttendanceItemRequest(
                7L, AttendanceStatus.PRESENTE, "Chegou no horário"
        )), director);

        ArgumentCaptor<Attendance> saved = ArgumentCaptor.forClass(Attendance.class);
        verify(attendanceRepository).save(saved.capture());
        assertThat(saved.getValue().getStatus()).isEqualTo(AttendanceStatus.PRESENTE);
        assertThat(saved.getValue().getNotes()).isEqualTo("Chegou no horário");
        assertThat(saved.getValue().getCheckedBy()).isSameAs(director);
        assertThat(saved.getValue().getCheckedAt()).isNotNull();
    }

    @Test
    void rejectsAttendanceForFutureEvent() {
        Event futureEvent = event(LocalDate.now().plusDays(1));
        when(eventRepository.findById(10L)).thenReturn(Optional.of(futureEvent));

        assertThatThrownBy(() -> service.save(10L, List.of(
                new AttendanceController.AttendanceItemRequest(7L, AttendanceStatus.PRESENTE, null)
        ), mock(AppUser.class)))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(error -> assertThat(((ResponseStatusException) error).getStatusCode())
                        .isEqualTo(HttpStatus.BAD_REQUEST));
        verify(attendanceRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void calculatesEventAttendanceSummaryFromRecordedStatuses() {
        Event event = event(LocalDate.now().minusDays(1));
        Member maria = member(1L, "Maria", "Maria");
        Member joao = member(2L, "João", "João");
        Member ana = member(3L, "Ana", "Ana");
        when(memberRepository.findByStatusOrderByFullNameAsc(MemberStatus.ATIVO))
                .thenReturn(List.of(maria, joao, ana));
        when(eventRepository.findByEventDateLessThanEqualOrderByEventDateDesc(LocalDate.now()))
                .thenReturn(List.of(event));
        when(attendanceRepository.findByEventId(10L)).thenReturn(List.of(
                attendance(event, maria, AttendanceStatus.PRESENTE),
                attendance(event, joao, AttendanceStatus.AUSENTE)
        ));
        when(eligibilitySnapshotRepository.findByEventId(10L))
                .thenReturn(Optional.of(new EventEligibilitySnapshot(event, 3)));
        when(memberRepository.countByStatus(MemberStatus.ATIVO)).thenReturn(99L);

        var result = service.eventSummaries(null, null);

        assertThat(result).singleElement().satisfies(summary -> {
            assertThat(summary.totalMembers()).isEqualTo(3);
            assertThat(summary.present()).isEqualTo(1);
            assertThat(summary.absent()).isEqualTo(1);
            assertThat(summary.pending()).isEqualTo(1);
            assertThat(summary.attendanceRate()).isEqualTo(50.0);
        });
        verify(memberRepository, never()).countByStatus(MemberStatus.ATIVO);
    }

    @Test
    void usesCurrentActiveMemberCountOnlyAsFallbackForEventWithoutSnapshot() {
        Event event = event(LocalDate.now().minusDays(1));
        Member maria = member(1L, "Maria", "Maria");
        when(eventRepository.findByEventDateLessThanEqualOrderByEventDateDesc(LocalDate.now()))
                .thenReturn(List.of(event));
        when(attendanceRepository.findByEventId(10L)).thenReturn(List.of(
                attendance(event, maria, AttendanceStatus.PRESENTE)
        ));
        when(eligibilitySnapshotRepository.findByEventId(10L)).thenReturn(Optional.empty());
        when(memberRepository.countByStatus(MemberStatus.ATIVO)).thenReturn(4L);

        var result = service.eventSummaries(null, null);

        assertThat(result).singleElement().satisfies(summary -> {
            assertThat(summary.totalMembers()).isEqualTo(4);
            assertThat(summary.present()).isEqualTo(1);
            assertThat(summary.pending()).isEqualTo(3);
        });
        verify(memberRepository).countByStatus(MemberStatus.ATIVO);
    }

    @Test
    void neverReturnsNegativePendingCountWhenThereAreMoreRecordsThanSnapshot() {
        Event event = event(LocalDate.now().minusDays(1));
        Member maria = member(1L, "Maria", "Maria");
        Member joao = member(2L, "João", "João");
        when(eventRepository.findByEventDateLessThanEqualOrderByEventDateDesc(LocalDate.now()))
                .thenReturn(List.of(event));
        when(attendanceRepository.findByEventId(10L)).thenReturn(List.of(
                attendance(event, maria, AttendanceStatus.PRESENTE),
                attendance(event, joao, AttendanceStatus.PRESENTE)
        ));
        when(eligibilitySnapshotRepository.findByEventId(10L))
                .thenReturn(Optional.of(new EventEligibilitySnapshot(event, 1)));

        var result = service.eventSummaries(null, null);

        assertThat(result).singleElement().satisfies(summary -> {
            assertThat(summary.totalMembers()).isEqualTo(1);
            assertThat(summary.pending()).isZero();
        });
    }

    private Event event(LocalDate date) {
        Event event = mock(Event.class);
        when(event.getId()).thenReturn(10L);
        when(event.getTitle()).thenReturn("Reunião mensal");
        when(event.getType()).thenReturn(EventType.REUNIAO);
        when(event.getEventDate()).thenReturn(date);
        when(event.getPlace()).thenReturn("Sede");
        return event;
    }

    private Member member(Long id, String fullName, String nickname) {
        Member member = mock(Member.class);
        when(member.getId()).thenReturn(id);
        when(member.getFullName()).thenReturn(fullName);
        when(member.getNickname()).thenReturn(nickname);
        when(member.getRole()).thenReturn("Membro");
        when(member.getStatus()).thenReturn(MemberStatus.ATIVO);
        return member;
    }

    private Attendance attendance(Event event, Member member, AttendanceStatus status) {
        return new Attendance(event, member, status);
    }
}
