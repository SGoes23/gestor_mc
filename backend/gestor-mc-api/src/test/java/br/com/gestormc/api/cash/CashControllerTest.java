package br.com.gestormc.api.cash;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
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
}
