package br.com.gestormc.api.cash;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/cash")
public class CashController {

    private final CashMovementRepository cashMovementRepository;

    public CashController(CashMovementRepository cashMovementRepository) {
        this.cashMovementRepository = cashMovementRepository;
    }

    @GetMapping("/balance")
    public CashBalanceResponse balance() {
        return new CashBalanceResponse(cashMovementRepository.calculateBalance());
    }

    public record CashBalanceResponse(BigDecimal balance) {
    }
}
