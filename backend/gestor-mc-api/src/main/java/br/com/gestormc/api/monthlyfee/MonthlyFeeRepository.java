package br.com.gestormc.api.monthlyfee;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MonthlyFeeRepository extends JpaRepository<MonthlyFee, Long> {
	Optional<MonthlyFee> findByMemberIdAndReferenceMonth(Long memberId, String referenceMonth);

	@EntityGraph(attributePaths = "member")
	List<MonthlyFee> findByReferenceMonthOrderByDueDateAsc(String referenceMonth);

	@EntityGraph(attributePaths = "member")
	List<MonthlyFee> findByMemberIdOrderByReferenceMonthDesc(Long memberId);

	@EntityGraph(attributePaths = "member")
	List<MonthlyFee> findByReferenceMonthAndStatusOrderByDueDateAsc(String referenceMonth, MonthlyFeeStatus status);
}
