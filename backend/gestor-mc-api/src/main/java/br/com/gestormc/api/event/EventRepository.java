package br.com.gestormc.api.event;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.time.LocalDate;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findAllByOrderByEventDateAsc();

    List<Event> findByEventDateLessThanEqualOrderByEventDateDesc(LocalDate eventDate);
}
