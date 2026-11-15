create table accounts_payable (
    id bigserial primary key,
    description varchar(180) not null,
    amount numeric(12, 2) not null,
    due_date date not null,
    status varchar(20) not null default 'PENDENTE',
    paid_date date,
    document_key varchar(500) not null unique,
    document_name varchar(255) not null,
    document_content_type varchar(120) not null,
    document_size bigint not null,
    created_at timestamp with time zone not null default current_timestamp,
    constraint ck_accounts_payable_positive_amount check (amount > 0),
    constraint ck_accounts_payable_document_size check (document_size > 0),
    constraint ck_accounts_payable_status check (status in ('PENDENTE', 'PAGO')),
    constraint ck_accounts_payable_paid_date check (
        (status = 'PENDENTE' and paid_date is null)
        or (status = 'PAGO' and paid_date is not null)
    )
);

create index idx_accounts_payable_due_date on accounts_payable (due_date);
create index idx_accounts_payable_status on accounts_payable (status);
