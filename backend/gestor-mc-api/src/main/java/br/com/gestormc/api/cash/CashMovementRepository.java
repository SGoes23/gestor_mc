package br.com.gestormc.api.cash;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface CashMovementRepository extends JpaRepository<CashMovement, Long> {

    boolean existsByMonthlyFeeId(Long monthlyFeeId);

    void deleteByMonthlyFeeId(Long monthlyFeeId);

    @Query("""
        select coalesce(sum(
            case when m.type = br.com.gestormc.api.cash.CashMovementType.ENTRADA
                 then m.amount
                 else -m.amount
            end
        ), 0)
        from CashMovement m
    """)
    BigDecimal calculateBalance();

    @Query("""
        select coalesce(sum(m.amount), 0)
        from CashMovement m
        where m.type = br.com.gestormc.api.cash.CashMovementType.ENTRADA
    """)
    BigDecimal calculateTotalIncome();

    @Query("""
        select coalesce(sum(m.amount), 0)
        from CashMovement m
        where m.type = br.com.gestormc.api.cash.CashMovementType.SAIDA
    """)
    BigDecimal calculateTotalExpense();

    @Query("""
        select m
        from CashMovement m
        left join fetch m.createdByUser u
        left join fetch u.member
        left join fetch m.monthlyFee
        order by m.movementDate desc, m.id desc
    """)
    List<CashMovement> findAllWithDetails();
}
