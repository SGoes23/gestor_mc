package br.com.gestormc.api.monthlyfee;

import br.com.gestormc.api.cash.CashMovement;
import br.com.gestormc.api.cash.CashMovementRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

@Service
public class MonthlyFeeService {

    private final MonthlyFeeRepository monthlyFeeRepository;
    private final CashMovementRepository cashMovementRepository;

    public MonthlyFeeService(MonthlyFeeRepository monthlyFeeRepository,
                             CashMovementRepository cashMovementRepository) {
        this.monthlyFeeRepository = monthlyFeeRepository;
        this.cashMovementRepository = cashMovementRepository;
    }

    @Transactional
    public MonthlyFee updateStatus(Long monthlyFeeId, MonthlyFeeStatus status, LocalDate paymentDate,
                                   boolean addToCash) {
        MonthlyFee fee = monthlyFeeRepository.findByIdWithMember(monthlyFeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensalidade nao encontrada"));

        fee.setStatus(status);
        if (status == MonthlyFeeStatus.PAGO) {
            LocalDate effectivePaymentDate = paymentDate != null ? paymentDate : LocalDate.now();
            fee.setPaymentDate(effectivePaymentDate);
            if (addToCash && !cashMovementRepository.existsByMonthlyFeeId(monthlyFeeId)) {
                String description = "Mensalidade " + fee.getReferenceMonth() + " - " + fee.getMember().getFullName();
                cashMovementRepository.save(new CashMovement(
                        fee,
                        fee.getAmount(),
                        effectivePaymentDate,
                        description
                ));
            }
        } else {
            fee.setPaymentDate(null);
            cashMovementRepository.deleteByMonthlyFeeId(monthlyFeeId);
        }

        return fee;
    }
}
