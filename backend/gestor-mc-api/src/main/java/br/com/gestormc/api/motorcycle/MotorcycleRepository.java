package br.com.gestormc.api.motorcycle;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MotorcycleRepository extends JpaRepository<Motorcycle, Long> {
	List<Motorcycle> findByMemberId(Long memberId);
}
