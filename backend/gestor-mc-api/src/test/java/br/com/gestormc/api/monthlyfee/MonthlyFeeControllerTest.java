package br.com.gestormc.api.monthlyfee;

import br.com.gestormc.api.member.Member;
import br.com.gestormc.api.member.MemberRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MonthlyFeeControllerTest {

    @Test
    void forwardsCashChoiceAndReturnsUpdatedFee() {
        MonthlyFeeRepository monthlyFeeRepository = mock(MonthlyFeeRepository.class);
        MemberRepository memberRepository = mock(MemberRepository.class);
        MonthlyFeeService monthlyFeeService = mock(MonthlyFeeService.class);
        MonthlyFeeController controller = new MonthlyFeeController(
                monthlyFeeRepository,
                memberRepository,
                monthlyFeeService
        );
        LocalDate paymentDate = LocalDate.of(2026, 11, 8);
        Member member = mock(Member.class);
        when(member.getFullName()).thenReturn("Maria Silva");
        when(member.getNickname()).thenReturn("Maria");
        MonthlyFee fee = mock(MonthlyFee.class);
        when(fee.getId()).thenReturn(10L);
        when(fee.getMemberId()).thenReturn(20L);
        when(fee.getMember()).thenReturn(member);
        when(fee.getReferenceMonth()).thenReturn("2026-11");
        when(fee.getAmount()).thenReturn(new BigDecimal("50.00"));
        when(fee.getDueDate()).thenReturn(LocalDate.of(2026, 11, 10));
        when(fee.getStatus()).thenReturn(MonthlyFeeStatus.PAGO);
        when(fee.getPaymentDate()).thenReturn(paymentDate);
        when(monthlyFeeService.updateStatus(10L, MonthlyFeeStatus.PAGO, paymentDate, true))
                .thenReturn(fee);

        MonthlyFeeController.MonthlyFeeResponse response = controller.updateStatus(
                10L,
                new MonthlyFeeController.UpdateMonthlyFeeStatusRequest(
                        MonthlyFeeStatus.PAGO,
                        paymentDate,
                        true
                )
        );

        verify(monthlyFeeService).updateStatus(10L, MonthlyFeeStatus.PAGO, paymentDate, true);
        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.memberFullName()).isEqualTo("Maria Silva");
        assertThat(response.amount()).isEqualByComparingTo("50.00");
        assertThat(response.status()).isEqualTo(MonthlyFeeStatus.PAGO);
        assertThat(response.paymentDate()).isEqualTo(paymentDate);
    }
}
