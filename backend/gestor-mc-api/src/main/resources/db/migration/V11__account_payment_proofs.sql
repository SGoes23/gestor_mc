alter table accounts_payable
    add column payment_proof_key varchar(500),
    add column payment_proof_name varchar(255),
    add column payment_proof_content_type varchar(120),
    add column payment_proof_size bigint;

alter table accounts_payable
    add constraint uk_accounts_payable_payment_proof_key unique (payment_proof_key),
    add constraint ck_accounts_payable_payment_proof_size
        check (payment_proof_size is null or payment_proof_size > 0),
    add constraint ck_accounts_payable_payment_proof_metadata
        check (
            (payment_proof_key is null
                and payment_proof_name is null
                and payment_proof_content_type is null
                and payment_proof_size is null)
            or
            (payment_proof_key is not null
                and payment_proof_name is not null
                and payment_proof_content_type is not null
                and payment_proof_size is not null)
        );
