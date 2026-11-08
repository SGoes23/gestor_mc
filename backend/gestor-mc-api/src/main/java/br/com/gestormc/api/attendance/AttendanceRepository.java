package br.com.gestormc.api.attendance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByEventId(Long eventId);

    Optional<Attendance> findByEventIdAndMemberId(Long eventId, Long memberId);
}
