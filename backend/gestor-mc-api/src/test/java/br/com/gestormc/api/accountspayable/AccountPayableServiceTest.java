package br.com.gestormc.api.accountspayable;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AccountPayableServiceTest {

    @Test
    void uploadsDocumentAndSavesAccountMetadata() {
        AccountPayableRepository repository = mock(AccountPayableRepository.class);
        DocumentStorage storage = mock(DocumentStorage.class);
        AccountPayableService service = new AccountPayableService(repository, storage);
        var file = new MockMultipartFile("file", "boleto.pdf", "application/pdf", "pdf-content".getBytes());
        when(repository.save(any(AccountPayable.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AccountPayable account = service.create(
                "Energia da sede", new BigDecimal("123.45"), LocalDate.of(2026, 11, 20), file
        );

        assertThat(account.getDescription()).isEqualTo("Energia da sede");
        assertThat(account.getAmount()).isEqualByComparingTo("123.45");
        assertThat(account.getDocumentName()).isEqualTo("boleto.pdf");
        assertThat(account.getStatus()).isEqualTo(AccountPayableStatus.PENDENTE);
        verify(storage).upload(any(String.class), any(byte[].class), org.mockito.ArgumentMatchers.eq("application/pdf"));
        verify(repository).save(any(AccountPayable.class));
    }

    @Test
    void rejectsUnsupportedFileBeforeCallingStorage() {
        AccountPayableRepository repository = mock(AccountPayableRepository.class);
        DocumentStorage storage = mock(DocumentStorage.class);
        AccountPayableService service = new AccountPayableService(repository, storage);
        var file = new MockMultipartFile("file", "script.exe", "application/octet-stream", new byte[]{1});

        assertThatThrownBy(() -> service.create(
                "Conta invalida", BigDecimal.TEN, LocalDate.of(2026, 11, 20), file
        )).isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("PDF, JPG, PNG ou WebP");

        verify(storage, never()).upload(any(), any(), any());
        verify(repository, never()).save(any());
    }

    @Test
    void fillsPaidDateWhenAccountIsMarkedAsPaid() {
        AccountPayableRepository repository = mock(AccountPayableRepository.class);
        DocumentStorage storage = mock(DocumentStorage.class);
        AccountPayableService service = new AccountPayableService(repository, storage);
        AccountPayable account = new AccountPayable(
                "Internet", BigDecimal.TEN, LocalDate.of(2026, 11, 20),
                "accounts-payable/key/internet.pdf", "internet.pdf", "application/pdf", 10
        );
        when(repository.findById(1L)).thenReturn(Optional.of(account));
        when(repository.save(account)).thenReturn(account);

        service.updateStatus(1L, AccountPayableStatus.PAGO, LocalDate.of(2026, 11, 15));

        assertThat(account.getStatus()).isEqualTo(AccountPayableStatus.PAGO);
        assertThat(account.getPaidDate()).isEqualTo(LocalDate.of(2026, 11, 15));
    }

    @Test
    void storesOptionalPaymentProofWhenMarkingAccountAsPaid() {
        AccountPayableRepository repository = mock(AccountPayableRepository.class);
        DocumentStorage storage = mock(DocumentStorage.class);
        AccountPayableService service = new AccountPayableService(repository, storage);
        AccountPayable account = account();
        var proof = new MockMultipartFile("file", "comprovante.png", "image/png", new byte[]{1, 2});
        when(repository.findById(1L)).thenReturn(Optional.of(account));
        when(repository.save(account)).thenReturn(account);

        service.markAsPaid(1L, LocalDate.of(2026, 11, 15), proof);

        assertThat(account.getStatus()).isEqualTo(AccountPayableStatus.PAGO);
        assertThat(account.getPaymentProofName()).isEqualTo("comprovante.png");
        assertThat(account.getPaymentProofContentType()).isEqualTo("image/png");
        verify(storage).upload(any(String.class), any(byte[].class), org.mockito.ArgumentMatchers.eq("image/png"));
    }

    @Test
    void replacesDocumentAndDeletesPreviousObjectOnlyAfterSave() {
        AccountPayableRepository repository = mock(AccountPayableRepository.class);
        DocumentStorage storage = mock(DocumentStorage.class);
        AccountPayableService service = new AccountPayableService(repository, storage);
        AccountPayable account = account();
        var replacement = new MockMultipartFile("file", "nota-nova.pdf", "application/pdf", new byte[]{3});
        when(repository.findById(1L)).thenReturn(Optional.of(account));
        when(repository.save(account)).thenReturn(account);

        service.replaceDocument(1L, replacement);

        assertThat(account.getDocumentName()).isEqualTo("nota-nova.pdf");
        verify(repository).save(account);
        verify(storage).deleteQuietly("accounts-payable/documents/old/document.pdf");
    }

    @Test
    void rejectsPaymentProofForPendingAccount() {
        AccountPayableRepository repository = mock(AccountPayableRepository.class);
        DocumentStorage storage = mock(DocumentStorage.class);
        AccountPayableService service = new AccountPayableService(repository, storage);
        when(repository.findById(1L)).thenReturn(Optional.of(account()));
        var proof = new MockMultipartFile("file", "comprovante.pdf", "application/pdf", new byte[]{1});

        assertThatThrownBy(() -> service.replacePaymentProof(1L, proof))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("conta paga");
        verify(storage, never()).upload(any(), any(), any());
    }

    private AccountPayable account() {
        return new AccountPayable(
                "Internet", BigDecimal.TEN, LocalDate.of(2026, 11, 20),
                "accounts-payable/documents/old/document.pdf", "document.pdf", "application/pdf", 10
        );
    }
}
