create table cash_movements (
    id bigserial primary key,
    monthly_fee_id bigint not null,
    amount numeric(10, 2) not null,
    movement_date date not null,
    description varchar(255) not null,
    created_at timestamp with time zone not null default current_timestamp,
    constraint fk_cash_movements_monthly_fee
        foreign key (monthly_fee_id) references monthly_fees(id),
    constraint uk_cash_movement_monthly_fee
        unique (monthly_fee_id),
    constraint ck_cash_movement_positive_amount
        check (amount > 0)
);
