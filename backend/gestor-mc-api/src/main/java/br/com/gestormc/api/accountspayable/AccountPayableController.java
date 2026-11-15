package br.com.gestormc.api.accountspayable;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/accounts-payable")
public class AccountPayableController {

    private final AccountPayableRepository repository;
    private final AccountPayableService service;
    private final DocumentStorage storage;

    public AccountPayableController(AccountPayableRepository repository, AccountPayableService service,
                                    DocumentStorage storage) {
        this.repository = repository;
        this.service = service;
        this.storage = storage;
    }

    @GetMapping
    public List<AccountPayableResponse> list() {
        return repository.findAllByOrderByDueDateDescIdDesc().stream().map(this::toResponse).toList();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public AccountPayableResponse create(
            @RequestParam String description,
            @RequestParam BigDecimal amount,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDate,
            @RequestParam MultipartFile file
    ) {
        return toResponse(service.create(description, amount, dueDate, file));
    }

    @PatchMapping("/{id}/status")
    public AccountPayableResponse updateStatus(@PathVariable long id,
                                               @RequestBody @Valid UpdateStatusRequest request) {
        return toResponse(service.updateStatus(id, request.status(), request.paidDate()));
    }

    @PatchMapping(value = "/{id}/payment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AccountPayableResponse markAsPaid(
            @PathVariable long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate paidDate,
            @RequestParam(required = false) MultipartFile file
    ) {
        return toResponse(service.markAsPaid(id, paidDate, file));
    }

    @PutMapping(value = "/{id}/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AccountPayableResponse replaceDocument(@PathVariable long id, @RequestParam MultipartFile file) {
        return toResponse(service.replaceDocument(id, file));
    }

    @PutMapping(value = "/{id}/payment-proof", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AccountPayableResponse replacePaymentProof(@PathVariable long id, @RequestParam MultipartFile file) {
        return toResponse(service.replacePaymentProof(id, file));
    }

    @GetMapping("/{id}/document")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable long id) {
        AccountPayable account = service.findById(id);
        return download(account.getDocumentKey(), account.getDocumentName(), account.getDocumentContentType());
    }

    @GetMapping("/{id}/payment-proof")
    public ResponseEntity<byte[]> downloadPaymentProof(@PathVariable long id) {
        AccountPayable account = service.findById(id);
        if (!account.hasPaymentProof()) {
            return ResponseEntity.notFound().build();
        }
        return download(account.getPaymentProofKey(), account.getPaymentProofName(),
                account.getPaymentProofContentType());
    }

    private ResponseEntity<byte[]> download(String key, String name, String contentType) {
        DocumentStorage.StoredDocument document = storage.download(key);
        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(contentType);
        } catch (IllegalArgumentException ignored) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }
        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(document.content().length)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(name, StandardCharsets.UTF_8)
                        .build().toString())
                .body(document.content());
    }

    private AccountPayableResponse toResponse(AccountPayable account) {
        return new AccountPayableResponse(
                account.getId(), account.getDescription(), account.getAmount(), account.getDueDate(),
                account.getStatus(), account.getPaidDate(), account.getDocumentName(),
                account.getDocumentContentType(), account.getDocumentSize(), account.hasPaymentProof(),
                account.getPaymentProofName(), account.getPaymentProofContentType(), account.getPaymentProofSize(),
                account.getCreatedAt()
        );
    }

    public record UpdateStatusRequest(@NotNull AccountPayableStatus status, LocalDate paidDate) {
    }

    public record AccountPayableResponse(
            Long id,
            String description,
            BigDecimal amount,
            LocalDate dueDate,
            AccountPayableStatus status,
            LocalDate paidDate,
            String documentName,
            String documentContentType,
            long documentSize,
            boolean hasPaymentProof,
            String paymentProofName,
            String paymentProofContentType,
            Long paymentProofSize,
            Instant createdAt
    ) {
    }
}
