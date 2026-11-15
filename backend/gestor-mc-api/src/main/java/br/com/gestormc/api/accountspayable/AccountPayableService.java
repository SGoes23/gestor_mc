package br.com.gestormc.api.accountspayable;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class AccountPayableService {

    static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf", "image/jpeg", "image/png", "image/webp"
    );

    private final AccountPayableRepository repository;
    private final DocumentStorage storage;

    public AccountPayableService(AccountPayableRepository repository, DocumentStorage storage) {
        this.repository = repository;
        this.storage = storage;
    }

    @Transactional
    public AccountPayable create(String description, BigDecimal amount, LocalDate dueDate, MultipartFile file) {
        validateAccount(description, amount, dueDate);
        UploadedFile uploaded = upload(file, "documents");
        try {
            return repository.save(new AccountPayable(
                    description.trim(), amount, dueDate, uploaded.key(), uploaded.name(),
                    uploaded.contentType(), uploaded.size()
            ));
        } catch (RuntimeException exception) {
            storage.deleteQuietly(uploaded.key());
            throw exception;
        }
    }

    @Transactional
    public AccountPayable markAsPaid(long id, LocalDate paidDate, MultipartFile paymentProof) {
        AccountPayable account = findById(id);
        account.updateStatus(AccountPayableStatus.PAGO, paidDate == null ? LocalDate.now() : paidDate);
        if (paymentProof == null || paymentProof.isEmpty()) {
            return repository.save(account);
        }

        UploadedFile uploaded = upload(paymentProof, "payment-proofs");
        String previousKey = account.getPaymentProofKey();
        account.replacePaymentProof(uploaded.key(), uploaded.name(), uploaded.contentType(), uploaded.size());
        return saveReplacement(account, uploaded.key(), previousKey);
    }

    @Transactional
    public AccountPayable replaceDocument(long id, MultipartFile file) {
        AccountPayable account = findById(id);
        UploadedFile uploaded = upload(file, "documents");
        String previousKey = account.getDocumentKey();
        account.replaceDocument(uploaded.key(), uploaded.name(), uploaded.contentType(), uploaded.size());
        return saveReplacement(account, uploaded.key(), previousKey);
    }

    @Transactional
    public AccountPayable replacePaymentProof(long id, MultipartFile file) {
        AccountPayable account = findById(id);
        if (account.getStatus() != AccountPayableStatus.PAGO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O comprovante so pode ser enviado para uma conta paga");
        }
        UploadedFile uploaded = upload(file, "payment-proofs");
        String previousKey = account.getPaymentProofKey();
        account.replacePaymentProof(uploaded.key(), uploaded.name(), uploaded.contentType(), uploaded.size());
        return saveReplacement(account, uploaded.key(), previousKey);
    }

    @Transactional
    public AccountPayable updateStatus(long id, AccountPayableStatus status, LocalDate paidDate) {
        AccountPayable account = findById(id);
        LocalDate effectivePaidDate = status == AccountPayableStatus.PAGO
                ? (paidDate == null ? LocalDate.now() : paidDate)
                : null;
        account.updateStatus(status, effectivePaidDate);
        return repository.save(account);
    }

    public AccountPayable findById(long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conta a pagar nao encontrada"));
    }

    private AccountPayable saveReplacement(AccountPayable account, String newKey, String previousKey) {
        try {
            AccountPayable saved = repository.save(account);
            registerReplacementCleanup(newKey, previousKey);
            return saved;
        } catch (RuntimeException exception) {
            storage.deleteQuietly(newKey);
            throw exception;
        }
    }

    private void registerReplacementCleanup(String newKey, String previousKey) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            if (previousKey != null && !previousKey.isBlank()) storage.deleteQuietly(previousKey);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                if (previousKey != null && !previousKey.isBlank()) storage.deleteQuietly(previousKey);
            }

            @Override
            public void afterCompletion(int status) {
                if (status != TransactionSynchronization.STATUS_COMMITTED) storage.deleteQuietly(newKey);
            }
        });
    }

    private UploadedFile upload(MultipartFile file, String folder) {
        validateFile(file);
        String originalName = safeOriginalName(file.getOriginalFilename());
        String contentType = normalizedContentType(file.getContentType());
        String key = "accounts-payable/" + folder + "/" + UUID.randomUUID() + "/" + originalName;
        try {
            storage.upload(key, file.getBytes(), contentType);
            return new UploadedFile(key, originalName, contentType, file.getSize());
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nao foi possivel ler o arquivo enviado", exception);
        }
    }

    private void validateAccount(String description, BigDecimal amount, LocalDate dueDate) {
        if (description == null || description.isBlank() || description.trim().length() > 180) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a conta/descricao com ate 180 caracteres");
        }
        if (amount == null || amount.signum() <= 0 || amount.scale() > 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um valor positivo com no maximo duas casas decimais");
        }
        if (dueDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a data de vencimento");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione um documento para a conta");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "O documento deve ter no maximo 10 MB");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(normalizedContentType(file.getContentType()))) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "Envie um arquivo PDF, JPG, PNG ou WebP");
        }
    }

    private String normalizedContentType(String contentType) {
        return contentType == null ? "application/octet-stream" : contentType.toLowerCase(Locale.ROOT);
    }

    private String safeOriginalName(String originalName) {
        String name = originalName == null ? "documento" : originalName.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1).replaceAll("[^a-zA-Z0-9._-]", "_");
        if (name.isBlank() || name.equals(".") || name.equals("..")) return "documento";
        return name.length() > 180 ? name.substring(name.length() - 180) : name;
    }

    private record UploadedFile(String key, String name, String contentType, long size) {
    }
}
