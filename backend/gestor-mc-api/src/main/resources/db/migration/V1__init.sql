create table if not exists members (
    id bigserial primary key,
    full_name varchar(120) not null,
    nickname varchar(60) not null unique,
    phone varchar(30) not null,
    blood_type varchar(20) not null,
    emergency_contact varchar(120) not null,
    member_role varchar(80) not null,
    status varchar(20) not null default 'ATIVO'
);

create table if not exists motorcycles (
    id bigserial primary key,
    model varchar(120) not null,
    year integer not null,
    color varchar(50) not null,
    license_plate varchar(15) not null unique,
    member_id bigint not null,
    constraint fk_motorcycles_member
        foreign key (member_id) references members(id)
);

create table if not exists monthly_fees (
    id bigserial primary key,
    member_id bigint not null,
    reference_month varchar(7) not null,
    amount numeric(10, 2) not null,
    due_date date not null,
    status varchar(20) not null,
    payment_date date,
    constraint fk_monthly_fees_member
        foreign key (member_id) references members(id),
    constraint uk_monthly_fee_member_reference
        unique (member_id, reference_month)
);

create table if not exists events (
    id bigserial primary key,
    title varchar(150) not null,
    type varchar(20) not null,
    event_date date not null,
    place varchar(150) not null,
    description varchar(500) not null
);

create table if not exists attendances (
    id bigserial primary key,
    event_id bigint not null,
    member_id bigint not null,
    confirmed boolean not null,
    attended boolean not null,
    constraint fk_attendances_event
        foreign key (event_id) references events(id),
    constraint fk_attendances_member
        foreign key (member_id) references members(id),
    constraint uk_attendance_event_member
        unique (event_id, member_id)
);
