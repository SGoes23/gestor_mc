package br.com.gestormc.api.monthlyfee;

import br.com.gestormc.api.cash.CashMovement;
import br.com.gestormc.api.cash.CashMovementRepository;
import br.com.gestormc.api.member.Member;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class MonthlyFeeServiceTest {

    private MonthlyFeeRepository monthlyFeeRepository;
    private CashMovementRepository cashMovementRepository;
    private MonthlyFeeService service;

    @BeforeEach
    void setUp() {
        monthlyFeeRepository = mock(MonthlyFeeRepository.class);
        cashMovementRepository = mock(CashMovementRepository.class);
        service = new MonthlyFeeService(monthlyFeeRepository, cashMovementRepository);
    }

    @Test
    void marksAsPaidAndAddsTheFeeAmountToCash() {
        MonthlyFee fee = fee();
        LocalDate paymentDate = LocalDate.of(2026, 11, 8);
        when(monthlyFeeRepository.findByIdWithMember(10L)).thenReturn(Optional.of(fee));
        when(cashMovementRepository.existsByMonthlyFeeId(10L)).thenReturn(false);

        service.updateStatus(10L, MonthlyFeeStatus.PAGO, paymentDate, true);

        ArgumentCaptor<CashMovement> movement = ArgumentCaptor.forClass(CashMovement.class);
        verify(cashMovementRepository).save(movement.capture());
        assertThat(fee.getStatus()).isEqualTo(MonthlyFeeStatus.PAGO);
        assertThat(fee.getPaymentDate()).isEqualTo(paymentDate);
        assertThat(movement.getValue().getAmount()).isEqualByComparingTo("50.00");
        assertThat(movement.getValue().getMovementDate()).isEqualTo(paymentDate);
        assertThat(movement.getValue().getMonthlyFee()).isSameAs(fee);
        assertThat(movement.getValue().getDescription()).isEqualTo("Mensalidade 2026-11 - Maria Silva");
    }

    @Test
    void marksAsPaidWithoutChangingCashWhenNotRequested() {
        MonthlyFee fee = fee();
        when(monthlyFeeRepository.findByIdWithMember(10L)).thenReturn(Optional.of(fee));

        service.updateStatus(10L, MonthlyFeeStatus.PAGO, LocalDate.of(2026, 11, 8), false);

        verify(cashMovementRepository, never()).save(org.mockito.ArgumentMatchers.any());
        verify(cashMovementRepository, never()).existsByMonthlyFeeId(org.mockito.ArgumentMatchers.anyLong());
    }

    @Test
    void doesNotDuplicateCashMovementForTheSameFee() {
        MonthlyFee fee = fee();
        when(monthlyFeeRepository.findByIdWithMember(10L)).thenReturn(Optional.of(fee));
        when(cashMovementRepository.existsByMonthlyFeeId(10L)).thenReturn(true);

        service.updateStatus(10L, MonthlyFeeStatus.PAGO, LocalDate.of(2026, 11, 8), true);

        verify(cashMovementRepository, never()).save(org.mockito.ArgumentMatchers.any());
        assertThat(fee.getStatus()).isEqualTo(MonthlyFeeStatus.PAGO);
    }

    @Test
    void removesTheLinkedCashMovementWhenPaymentIsReverted() {
        MonthlyFee fee = fee();
        when(monthlyFeeRepository.findByIdWithMember(10L)).thenReturn(Optional.of(fee));

        service.updateStatus(10L, MonthlyFeeStatus.PENDENTE, null, false);

        verify(cashMovementRepository).deleteByMonthlyFeeId(10L);
        assertThat(fee.getStatus()).isEqualTo(MonthlyFeeStatus.PENDENTE);
        assertThat(fee.getPaymentDate()).isNull();
    }

    @Test
    void usesCurrentDateWhenPaymentDateIsNotProvided() {
        MonthlyFee fee = fee();
        LocalDate beforeUpdate = LocalDate.now();
        when(monthlyFeeRepository.findByIdWithMember(10L)).thenReturn(Optional.of(fee));

        service.updateStatus(10L, MonthlyFeeStatus.PAGO, null, false);

        assertThat(fee.getPaymentDate()).isBetween(beforeUpdate, LocalDate.now());
    }

    @Test
    void throwsNotFoundAndDoesNotTouchCashForUnknownFee() {
        when(monthlyFeeRepository.findByIdWithMember(999L)).thenReturn(Optional.empty());

        org.assertj.core.api.Assertions.assertThatThrownBy(
                        () -> service.updateStatus(999L, MonthlyFeeStatus.PAGO, null, true)
                )
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(error -> assertThat(((ResponseStatusException) error).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
        verifyNoInteractions(cashMovementRepository);
    }

    private MonthlyFee fee() {
        Member member = mock(Member.class);
        when(member.getFullName()).thenReturn("Maria Silva");
        return new MonthlyFee(
                member,
                "2026-11",
                new BigDecimal("50.00"),
                LocalDate.of(2026, 11, 10),
                MonthlyFeeStatus.PENDENTE,
                null
        );
    }
}
