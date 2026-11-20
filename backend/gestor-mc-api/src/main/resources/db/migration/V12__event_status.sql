alter table events
    add column status varchar(20) not null default 'AGENDADO';

alter table events
    add constraint chk_event_status
        check (status in ('AGENDADO', 'CONCLUIDO', 'CANCELADO'));
