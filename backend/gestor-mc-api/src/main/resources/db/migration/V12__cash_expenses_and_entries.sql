alter table cash_movements alter column monthly_fee_id drop not null;

alter table cash_movements add column movement_type varchar(10) not null default 'ENTRADA';
alter table cash_movements add constraint ck_cash_movement_type check (movement_type in ('ENTRADA', 'SAIDA'));

alter table cash_movements add column category varchar(50) not null default 'MENSALIDADE';

alter table cash_movements add column created_by_user_id bigint;
alter table cash_movements add constraint fk_cash_movements_created_by
    foreign key (created_by_user_id) references app_users(id);

create index idx_cash_movements_date on cash_movements(movement_date desc);
create index idx_cash_movements_type on cash_movements(movement_type);
