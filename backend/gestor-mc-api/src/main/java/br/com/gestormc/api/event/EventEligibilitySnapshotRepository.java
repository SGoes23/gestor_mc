package br.com.gestormc.api.event;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EventEligibilitySnapshotRepository extends JpaRepository<EventEligibilitySnapshot, Long> {
    Optional<EventEligibilitySnapshot> findByEventId(Long eventId);
}
