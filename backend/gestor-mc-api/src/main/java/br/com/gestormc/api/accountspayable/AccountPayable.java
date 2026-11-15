package br.com.gestormc.api.accountspayable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "accounts_payable")
public class AccountPayable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountPayableStatus status;

    @Column(name = "paid_date")
    private LocalDate paidDate;

    @Column(name = "document_key", nullable = false, unique = true, length = 500)
    private String documentKey;

    @Column(name = "document_name", nullable = false)
    private String documentName;

    @Column(name = "document_content_type", nullable = false, length = 120)
    private String documentContentType;

    @Column(name = "document_size", nullable = false)
    private long documentSize;

    @Column(name = "payment_proof_key", unique = true, length = 500)
    private String paymentProofKey;

    @Column(name = "payment_proof_name")
    private String paymentProofName;

    @Column(name = "payment_proof_content_type", length = 120)
    private String paymentProofContentType;

    @Column(name = "payment_proof_size")
    private Long paymentProofSize;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    protected AccountPayable() {
    }

    public AccountPayable(String description, BigDecimal amount, LocalDate dueDate, String documentKey,
                          String documentName, String documentContentType, long documentSize) {
        this.description = description;
        this.amount = amount;
        this.dueDate = dueDate;
        this.status = AccountPayableStatus.PENDENTE;
        this.documentKey = documentKey;
        this.documentName = documentName;
        this.documentContentType = documentContentType;
        this.documentSize = documentSize;
    }

    public void updateStatus(AccountPayableStatus status, LocalDate paidDate) {
        this.status = status;
        this.paidDate = status == AccountPayableStatus.PAGO ? paidDate : null;
    }

    public void replaceDocument(String key, String name, String contentType, long size) {
        this.documentKey = key;
        this.documentName = name;
        this.documentContentType = contentType;
        this.documentSize = size;
    }

    public void replacePaymentProof(String key, String name, String contentType, long size) {
        this.paymentProofKey = key;
        this.paymentProofName = name;
        this.paymentProofContentType = contentType;
        this.paymentProofSize = size;
    }

    public Long getId() { return id; }
    public String getDescription() { return description; }
    public BigDecimal getAmount() { return amount; }
    public LocalDate getDueDate() { return dueDate; }
    public AccountPayableStatus getStatus() { return status; }
    public LocalDate getPaidDate() { return paidDate; }
    public String getDocumentKey() { return documentKey; }
    public String getDocumentName() { return documentName; }
    public String getDocumentContentType() { return documentContentType; }
    public long getDocumentSize() { return documentSize; }
    public String getPaymentProofKey() { return paymentProofKey; }
    public String getPaymentProofName() { return paymentProofName; }
    public String getPaymentProofContentType() { return paymentProofContentType; }
    public Long getPaymentProofSize() { return paymentProofSize; }
    public boolean hasPaymentProof() { return paymentProofKey != null; }
    public Instant getCreatedAt() { return createdAt; }
}
