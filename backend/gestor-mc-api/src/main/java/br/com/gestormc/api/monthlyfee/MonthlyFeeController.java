package br.com.gestormc.api.monthlyfee;

import br.com.gestormc.api.member.Member;
import br.com.gestormc.api.member.MemberRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/monthly-fees")
public class MonthlyFeeController {

    private final MonthlyFeeRepository monthlyFeeRepository;
    private final MemberRepository memberRepository;

    public MonthlyFeeController(MonthlyFeeRepository monthlyFeeRepository, MemberRepository memberRepository) {
        this.monthlyFeeRepository = monthlyFeeRepository;
        this.memberRepository = memberRepository;
    }

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    public GenerationResponse generate(@RequestBody @Valid GenerateMonthlyFeesRequest request) {
        List<Member> members = memberRepository.findAll();
        int created = 0;
        int existing = 0;

        for (Member member : members) {
            boolean alreadyExists = monthlyFeeRepository
                    .findByMemberIdAndReferenceMonth(member.getId(), request.referenceMonth())
                    .isPresent();
            if (alreadyExists) {
                existing++;
                continue;
            }

            MonthlyFee fee = new MonthlyFee(
                    member,
                    request.referenceMonth(),
                    request.amount(),
                    request.dueDate(),
                    MonthlyFeeStatus.PENDENTE,
                    null
            );
            monthlyFeeRepository.save(fee);
            created++;
        }

        return new GenerationResponse(request.referenceMonth(), created, existing);
    }

    @GetMapping
    public List<MonthlyFeeResponse> listByMonth(@RequestParam @Pattern(regexp = "^\\d{4}-\\d{2}$") String referenceMonth) {
        return monthlyFeeRepository.findByReferenceMonthOrderByDueDateAsc(referenceMonth)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/defaulters")
    public List<MonthlyFeeResponse> defaulters(@RequestParam @Pattern(regexp = "^\\d{4}-\\d{2}$") String referenceMonth) {
        return monthlyFeeRepository.findByReferenceMonthAndStatusOrderByDueDateAsc(referenceMonth, MonthlyFeeStatus.PENDENTE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/history/member/{memberId}")
    public List<MonthlyFeeResponse> memberHistory(@PathVariable Long memberId) {
        if (!memberRepository.existsById(memberId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Membro nao encontrado");
        }
        return monthlyFeeRepository.findByMemberIdOrderByReferenceMonthDesc(memberId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PatchMapping("/{monthlyFeeId}/status")
    public MonthlyFeeResponse updateStatus(@PathVariable Long monthlyFeeId,
                                           @RequestBody @Valid UpdateMonthlyFeeStatusRequest request) {
        MonthlyFee fee = monthlyFeeRepository.findById(monthlyFeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensalidade nao encontrada"));

        fee.setStatus(request.status());
        if (request.status() == MonthlyFeeStatus.PAGO) {
            fee.setPaymentDate(request.paymentDate() != null ? request.paymentDate() : LocalDate.now());
        } else {
            fee.setPaymentDate(null);
        }

        return toResponse(monthlyFeeRepository.save(fee));
    }

    private MonthlyFeeResponse toResponse(MonthlyFee fee) {
        Member member = fee.getMember();
        return new MonthlyFeeResponse(
                fee.getId(),
                fee.getMemberId(),
                member.getFullName(),
                member.getNickname(),
                fee.getReferenceMonth(),
                fee.getAmount(),
                fee.getDueDate(),
                fee.getStatus(),
                fee.getPaymentDate()
        );
    }

    public record GenerateMonthlyFeesRequest(
            @NotBlank
            @Pattern(regexp = "^\\d{4}-\\d{2}$")
            String referenceMonth,
            @NotNull BigDecimal amount,
            @NotNull LocalDate dueDate
    ) {
    }

    public record GenerationResponse(
            String referenceMonth,
            int created,
            int existing
    ) {
    }

    public record UpdateMonthlyFeeStatusRequest(
            @NotNull MonthlyFeeStatus status,
            LocalDate paymentDate
    ) {
    }

    public record MonthlyFeeResponse(
            Long id,
            Long memberId,
            String memberFullName,
            String memberNickname,
            String referenceMonth,
            BigDecimal amount,
            LocalDate dueDate,
            MonthlyFeeStatus status,
            LocalDate paymentDate
    ) {
    }
}
