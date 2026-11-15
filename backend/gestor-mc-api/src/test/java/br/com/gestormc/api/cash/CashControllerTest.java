package br.com.gestormc.api.cash;

import br.com.gestormc.api.auth.AccessProfile;
import br.com.gestormc.api.auth.AppUser;
import br.com.gestormc.api.member.BloodType;
import br.com.gestormc.api.member.Member;
import br.com.gestormc.api.member.MemberStatus;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CashControllerTest {

    @Test
    void returnsCalculatedCashBalance() {
        CashMovementRepository repository = mock(CashMovementRepository.class);
        when(repository.calculateBalance()).thenReturn(new BigDecimal("150.75"));
        CashController controller = new CashController(repository);

        CashController.CashBalanceResponse response = controller.balance();

        verify(repository).calculateBalance();
        assertThat(response.balance()).isEqualByComparingTo("150.75");
    }

    @Test
    void returnsCalculatedCashSummary() {
        CashMovementRepository repository = mock(CashMovementRepository.class);
        when(repository.calculateBalance()).thenReturn(new BigDecimal("1500.00"));
        when(repository.calculateTotalIncome()).thenReturn(new BigDecimal("2000.00"));
        when(repository.calculateTotalExpense()).thenReturn(new BigDecimal("500.00"));
        CashController controller = new CashController(repository);

        CashController.CashSummaryResponse summary = controller.summary();

        verify(repository).calculateBalance();
        verify(repository).calculateTotalIncome();
        verify(repository).calculateTotalExpense();
        assertThat(summary.balance()).isEqualByComparingTo("1500.00");
        assertThat(summary.totalIncome()).isEqualByComparingTo("2000.00");
        assertThat(summary.totalExpense()).isEqualByComparingTo("500.00");
    }

    @Test
    void createsCashMovementWithAuthenticatedUser() {
        CashMovementRepository repository = mock(CashMovementRepository.class);
        CashController controller = new CashController(repository);

        Member member = new Member("Saulo Goes", "Tigrão", "11999999999", BloodType.O_POSITIVE,
                "Esposa 11888888888", "Rua 1", "01001000", "12345678901", "Presidente", MemberStatus.ATIVO);
        AppUser user = new AppUser("admin@gestormc.local", "hash", AccessProfile.DIRETORIA, member);

        CashController.CreateCashMovementRequest request = new CashController.CreateCashMovementRequest(
                CashMovementType.SAIDA,
                "SEDE",
                new BigDecimal("250.00"),
                LocalDate.of(2026, 11, 15),
                "Conserto do telhado da sede"
        );

        when(repository.save(any(CashMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CashController.CashMovementResponse response = controller.createMovement(request, user);

        ArgumentCaptor<CashMovement> captor = ArgumentCaptor.forClass(CashMovement.class);
        verify(repository).save(captor.capture());
        CashMovement saved = captor.getValue();

        assertThat(saved.getType()).isEqualTo(CashMovementType.SAIDA);
        assertThat(saved.getCategory()).isEqualTo("SEDE");
        assertThat(saved.getAmount()).isEqualByComparingTo("250.00");
        assertThat(saved.getDescription()).isEqualTo("Conserto do telhado da sede");
        assertThat(saved.getCreatedByUser()).isEqualTo(user);
        assertThat(response.createdBy().memberName()).isEqualTo("Saulo Goes");
    }

    @Test
    void deletesManualCashMovement() {
        CashMovementRepository repository = mock(CashMovementRepository.class);
        CashController controller = new CashController(repository);

        CashMovement movement = new CashMovement(
                null,
                CashMovementType.SAIDA,
                "SEDE",
                new BigDecimal("100.00"),
                LocalDate.now(),
                "Limpeza",
                null
        );

        when(repository.findById(1L)).thenReturn(Optional.of(movement));

        controller.deleteMovement(1L);

        verify(repository).delete(movement);
    }
}
