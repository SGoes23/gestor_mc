alter table members
    add column cpf varchar(11) not null default '';

create unique index uk_members_cpf
    on members (cpf)
    where cpf <> '';
