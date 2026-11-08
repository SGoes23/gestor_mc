package br.com.gestormc.api.cash;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;

public interface CashMovementRepository extends JpaRepository<CashMovement, Long> {

    boolean existsByMonthlyFeeId(Long monthlyFeeId);

    void deleteByMonthlyFeeId(Long monthlyFeeId);

    @Query("select coalesce(sum(m.amount), 0) from CashMovement m")
    BigDecimal calculateBalance();
}
