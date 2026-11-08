alter table attendances
    add column status varchar(20) not null default 'NAO_REGISTRADO',
    add column notes varchar(500),
    add column checked_at timestamp with time zone,
    add column checked_by_user_id bigint,
    add column created_at timestamp with time zone not null default current_timestamp,
    add column updated_at timestamp with time zone not null default current_timestamp;

update attendances
set status = case when attended then 'PRESENTE' else 'NAO_REGISTRADO' end;

alter table attendances
    add constraint fk_attendances_checked_by
        foreign key (checked_by_user_id) references app_users(id);

alter table attendances
    drop column confirmed,
    drop column attended;
