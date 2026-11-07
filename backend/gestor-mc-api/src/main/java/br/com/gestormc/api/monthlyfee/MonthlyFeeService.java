package br.com.gestormc.api.monthlyfee;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

@Service
public class MonthlyFeeService {

    private final MonthlyFeeRepository monthlyFeeRepository;

    public MonthlyFeeService(MonthlyFeeRepository monthlyFeeRepository) {
        this.monthlyFeeRepository = monthlyFeeRepository;
    }

    @Transactional
    public MonthlyFee updateStatus(Long monthlyFeeId, MonthlyFeeStatus status, LocalDate paymentDate) {
        MonthlyFee fee = monthlyFeeRepository.findByIdWithMember(monthlyFeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensalidade nao encontrada"));

        fee.setStatus(status);
        if (status == MonthlyFeeStatus.PAGO) {
            fee.setPaymentDate(paymentDate != null ? paymentDate : LocalDate.now());
        } else {
            fee.setPaymentDate(null);
        }

        return fee;
    }
}
