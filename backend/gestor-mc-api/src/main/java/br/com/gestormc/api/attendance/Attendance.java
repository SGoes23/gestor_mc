package br.com.gestormc.api.attendance;

import br.com.gestormc.api.event.Event;
import br.com.gestormc.api.member.Member;
import br.com.gestormc.api.auth.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

@Entity
@Table(name = "attendances", uniqueConstraints = {
        @UniqueConstraint(name = "uk_attendance_event_member", columnNames = {"event_id", "member_id"})
})
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttendanceStatus status;

    @Column(length = 500)
    private String notes;

    @Column(name = "checked_at")
    private Instant checkedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checked_by_user_id")
    private AppUser checkedBy;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Attendance() {
    }

    public Attendance(Event event, Member member, AttendanceStatus status) {
        this.event = event;
        this.member = member;
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    public Member getMember() {
        return member;
    }

    public void setMember(Member member) {
        this.member = member;
    }

    public AttendanceStatus getStatus() {
        return status;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getCheckedAt() {
        return checkedAt;
    }

    public AppUser getCheckedBy() {
        return checkedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void update(AttendanceStatus status, String notes, AppUser checkedBy) {
        this.status = status;
        this.notes = notes == null || notes.isBlank() ? null : notes.trim();
        this.checkedBy = checkedBy;
        this.checkedAt = Instant.now();
        this.updatedAt = this.checkedAt;
    }
}
