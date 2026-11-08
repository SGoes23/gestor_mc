package br.com.gestormc.api.monthlyfee;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MonthlyFeeRepository extends JpaRepository<MonthlyFee, Long> {
	Optional<MonthlyFee> findByMemberIdAndReferenceMonth(Long memberId, String referenceMonth);

	@Query("select fee from MonthlyFee fee join fetch fee.member where fee.id = :id")
	Optional<MonthlyFee> findByIdWithMember(@Param("id") Long id);

	@EntityGraph(attributePaths = "member")
	List<MonthlyFee> findByReferenceMonthOrderByDueDateAsc(String referenceMonth);

	@EntityGraph(attributePaths = "member")
	List<MonthlyFee> findByMemberIdOrderByReferenceMonthDesc(Long memberId);

	@EntityGraph(attributePaths = "member")
	List<MonthlyFee> findByReferenceMonthAndStatusOrderByDueDateAsc(String referenceMonth, MonthlyFeeStatus status);
}
