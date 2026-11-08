package br.com.gestormc.api.cash;

import br.com.gestormc.api.monthlyfee.MonthlyFee;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
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

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "monthly_fee_id", nullable = false, unique = true)
    private MonthlyFee monthlyFee;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "movement_date", nullable = false)
    private LocalDate movementDate;

    @Column(nullable = false, length = 255)
    private String description;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    protected CashMovement() {
    }

    public CashMovement(MonthlyFee monthlyFee, BigDecimal amount, LocalDate movementDate, String description) {
        this.monthlyFee = monthlyFee;
        this.amount = amount;
        this.movementDate = movementDate;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public MonthlyFee getMonthlyFee() {
        return monthlyFee;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public LocalDate getMovementDate() {
        return movementDate;
    }

    public String getDescription() {
        return description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
