create table event_eligibility_history (
    id bigserial primary key,
    event_id bigint not null unique,
    eligible_members_count integer not null,
    captured_at timestamp with time zone not null default current_timestamp,
    constraint chk_event_eligibility_count_non_negative
        check (eligible_members_count >= 0),
    constraint fk_event_eligibility_event
        foreign key (event_id) references events(id) on delete cascade
);

-- Eventos antigos não possuem o snapshot original. Neles, preservamos ao
-- menos os membros ativos atuais e quem já teve presença registrada.
insert into event_eligibility_history (event_id, eligible_members_count)
select e.id,
       greatest(
           (select count(*) from members m where m.status = 'ATIVO'),
           (select count(distinct a.member_id) from attendances a where a.event_id = e.id)
       )::integer
from events e;
