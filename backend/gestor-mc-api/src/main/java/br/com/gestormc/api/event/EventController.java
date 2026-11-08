package br.com.gestormc.api.event;

import br.com.gestormc.api.member.MemberRepository;
import br.com.gestormc.api.member.MemberStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventRepository eventRepository;
    private final EventEligibilitySnapshotRepository eligibilitySnapshotRepository;
    private final MemberRepository memberRepository;

    public EventController(EventRepository eventRepository,
                           EventEligibilitySnapshotRepository eligibilitySnapshotRepository,
                           MemberRepository memberRepository) {
        this.eventRepository = eventRepository;
        this.eligibilitySnapshotRepository = eligibilitySnapshotRepository;
        this.memberRepository = memberRepository;
    }

    @GetMapping
    public List<EventResponse> list() {
        return eventRepository.findAllByOrderByEventDateAsc().stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    public EventResponse detail(@PathVariable Long id) {
        return toResponse(findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public EventResponse create(@RequestBody @Valid UpsertEventRequest request) {
        Event event = new Event(
                request.title(),
                request.type(),
                request.eventDate(),
                request.place(),
                request.description()
        );
        event = eventRepository.save(event);
        int eligibleMembers = Math.toIntExact(memberRepository.countByStatus(MemberStatus.ATIVO));
        eligibilitySnapshotRepository.save(new EventEligibilitySnapshot(event, eligibleMembers));
        return toResponse(event);
    }

    @PutMapping("/{id}")
    public EventResponse update(@PathVariable Long id, @RequestBody @Valid UpsertEventRequest request) {
        Event event = findById(id);
        event.setTitle(request.title());
        event.setType(request.type());
        event.setEventDate(request.eventDate());
        event.setPlace(request.place());
        event.setDescription(request.description());
        return toResponse(eventRepository.save(event));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        eventRepository.delete(findById(id));
    }

    private Event findById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento nao encontrado"));
    }

    private EventResponse toResponse(Event event) {
        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getType(),
                event.getEventDate(),
                event.getPlace(),
                event.getDescription()
        );
    }

    public record UpsertEventRequest(
            @NotBlank String title,
            @NotNull EventType type,
            @NotNull LocalDate eventDate,
            @NotBlank String place,
            @NotBlank String description
    ) {
    }

    public record EventResponse(
            Long id,
            String title,
            EventType type,
            LocalDate eventDate,
            String place,
            String description
    ) {
    }
}
