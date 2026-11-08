package br.com.gestormc.api.event;

import br.com.gestormc.api.member.MemberRepository;
import br.com.gestormc.api.member.MemberStatus;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class EventControllerTest {

    @Test
    void capturesEligibleMemberCountWhenEventIsCreated() {
        EventRepository eventRepository = mock(EventRepository.class);
        EventEligibilitySnapshotRepository snapshotRepository = mock(EventEligibilitySnapshotRepository.class);
        MemberRepository memberRepository = mock(MemberRepository.class);
        EventController controller = new EventController(
                eventRepository,
                snapshotRepository,
                memberRepository
        );
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(memberRepository.countByStatus(MemberStatus.ATIVO)).thenReturn(12L);

        controller.create(new EventController.UpsertEventRequest(
                "Reunião mensal",
                EventType.REUNIAO,
                LocalDate.of(2026, 11, 20),
                "Sede",
                "Reunião ordinária"
        ));

        ArgumentCaptor<EventEligibilitySnapshot> snapshot =
                ArgumentCaptor.forClass(EventEligibilitySnapshot.class);
        verify(snapshotRepository).save(snapshot.capture());
        assertThat(snapshot.getValue().getEligibleMembersCount()).isEqualTo(12);
        verify(memberRepository).countByStatus(MemberStatus.ATIVO);
    }

    @Test
    void doesNotRecalculateEligibilityWhenEventIsUpdated() {
        EventRepository eventRepository = mock(EventRepository.class);
        EventEligibilitySnapshotRepository snapshotRepository = mock(EventEligibilitySnapshotRepository.class);
        MemberRepository memberRepository = mock(MemberRepository.class);
        EventController controller = new EventController(
                eventRepository,
                snapshotRepository,
                memberRepository
        );
        Event existing = new Event(
                "Reunião antiga",
                EventType.REUNIAO,
                LocalDate.of(2026, 11, 10),
                "Sede",
                "Descrição antiga"
        );
        when(eventRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(eventRepository.save(existing)).thenReturn(existing);

        controller.update(10L, new EventController.UpsertEventRequest(
                "Reunião atualizada",
                EventType.REUNIAO,
                LocalDate.of(2026, 11, 21),
                "Nova sede",
                "Descrição atualizada"
        ));

        verifyNoInteractions(snapshotRepository, memberRepository);
        assertThat(existing.getTitle()).isEqualTo("Reunião atualizada");
    }
}
