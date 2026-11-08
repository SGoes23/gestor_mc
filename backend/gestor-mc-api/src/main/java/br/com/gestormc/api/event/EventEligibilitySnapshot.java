package br.com.gestormc.api.event;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "event_eligibility_history")
public class EventEligibilitySnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false, unique = true)
    private Event event;

    @Column(name = "eligible_members_count", nullable = false)
    private int eligibleMembersCount;

    @Column(name = "captured_at", nullable = false, insertable = false, updatable = false)
    private Instant capturedAt;

    public EventEligibilitySnapshot() {
    }

    public EventEligibilitySnapshot(Event event, int eligibleMembersCount) {
        this.event = event;
        this.eligibleMembersCount = eligibleMembersCount;
    }

    public Long getId() {
        return id;
    }

    public Event getEvent() {
        return event;
    }

    public int getEligibleMembersCount() {
        return eligibleMembersCount;
    }

    public Instant getCapturedAt() {
        return capturedAt;
    }
}
