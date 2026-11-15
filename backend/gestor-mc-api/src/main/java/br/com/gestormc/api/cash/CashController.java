package br.com.gestormc.api.cash;

import br.com.gestormc.api.auth.AppUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

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

    @GetMapping("/summary")
    public CashSummaryResponse summary() {
        BigDecimal balance = cashMovementRepository.calculateBalance();
        BigDecimal totalIncome = cashMovementRepository.calculateTotalIncome();
        BigDecimal totalExpense = cashMovementRepository.calculateTotalExpense();
        return new CashSummaryResponse(balance, totalIncome, totalExpense);
    }

    @GetMapping("/movements")
    public List<CashMovementResponse> listMovements() {
        return cashMovementRepository.findAllWithDetails()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping("/movements")
    @ResponseStatus(HttpStatus.CREATED)
    public CashMovementResponse createMovement(@RequestBody @Valid CreateCashMovementRequest request,
                                               @AuthenticationPrincipal AppUser user) {
        CashMovement movement = new CashMovement(
                null,
                request.type(),
                request.category(),
                request.amount(),
                request.movementDate(),
                request.description(),
                user
        );
        CashMovement saved = cashMovementRepository.save(movement);
        return toResponse(saved);
    }

    @DeleteMapping("/movements/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMovement(@PathVariable Long id) {
        CashMovement movement = cashMovementRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movimentação não encontrada"));

        if (movement.getMonthlyFee() != null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Lançamento vinculado a uma mensalidade. Para estorná-lo, altere o status da mensalidade."
            );
        }

        cashMovementRepository.delete(movement);
    }

    private CashMovementResponse toResponse(CashMovement movement) {
        CreatedByResponse createdBy = null;
        if (movement.getCreatedByUser() != null) {
            AppUser u = movement.getCreatedByUser();
            String memberName = u.getMember() != null ? u.getMember().getFullName() : null;
            String memberNickname = u.getMember() != null ? u.getMember().getNickname() : null;
            createdBy = new CreatedByResponse(u.getId(), u.getEmail(), memberName, memberNickname);
        }

        Long monthlyFeeId = movement.getMonthlyFee() != null ? movement.getMonthlyFee().getId() : null;

        return new CashMovementResponse(
                movement.getId(),
                monthlyFeeId,
                movement.getType(),
                movement.getCategory(),
                movement.getAmount(),
                movement.getMovementDate(),
                movement.getDescription(),
                createdBy,
                movement.getCreatedAt()
        );
    }

    public record CashBalanceResponse(BigDecimal balance) {
    }

    public record CashSummaryResponse(
            BigDecimal balance,
            BigDecimal totalIncome,
            BigDecimal totalExpense
    ) {
    }

    public record CreateCashMovementRequest(
            @NotNull CashMovementType type,
            @NotBlank String category,
            @NotNull @DecimalMin("0.01") BigDecimal amount,
            @NotNull LocalDate movementDate,
            @NotBlank String description
    ) {
    }

    public record CreatedByResponse(
            Long id,
            String email,
            String memberName,
            String memberNickname
    ) {
    }

    public record CashMovementResponse(
            Long id,
            Long monthlyFeeId,
            CashMovementType type,
            String category,
            BigDecimal amount,
            LocalDate movementDate,
            String description,
            CreatedByResponse createdBy,
            Instant createdAt
    ) {
    }
}
