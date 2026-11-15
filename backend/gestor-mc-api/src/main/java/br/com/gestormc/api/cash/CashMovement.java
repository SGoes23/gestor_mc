package br.com.gestormc.api.cash;

import br.com.gestormc.api.auth.AppUser;
import br.com.gestormc.api.monthlyfee.MonthlyFee;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "cash_movements")
public class CashMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "monthly_fee_id", unique = true)
    private MonthlyFee monthlyFee;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 10)
    private CashMovementType type;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "movement_date", nullable = false)
    private LocalDate movementDate;

    @Column(nullable = false, length = 255)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private AppUser createdByUser;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    protected CashMovement() {
    }

    public CashMovement(MonthlyFee monthlyFee, BigDecimal amount, LocalDate movementDate, String description) {
        this(monthlyFee, CashMovementType.ENTRADA, "MENSALIDADE", amount, movementDate, description, null);
    }

    public CashMovement(MonthlyFee monthlyFee, CashMovementType type, String category,
                        BigDecimal amount, LocalDate movementDate, String description, AppUser createdByUser) {
        this.monthlyFee = monthlyFee;
        this.type = type != null ? type : CashMovementType.ENTRADA;
        this.category = category != null && !category.isBlank() ? category : "OUTROS";
        this.amount = amount;
        this.movementDate = movementDate;
        this.description = description;
        this.createdByUser = createdByUser;
    }

    public Long getId() {
        return id;
    }

    public MonthlyFee getMonthlyFee() {
        return monthlyFee;
    }

    public CashMovementType getType() {
        return type;
    }

    public void setType(CashMovementType type) {
        this.type = type;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public LocalDate getMovementDate() {
        return movementDate;
    }

    public void setMovementDate(LocalDate movementDate) {
        this.movementDate = movementDate;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public AppUser getCreatedByUser() {
        return createdByUser;
    }

    public void setCreatedByUser(AppUser createdByUser) {
        this.createdByUser = createdByUser;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
