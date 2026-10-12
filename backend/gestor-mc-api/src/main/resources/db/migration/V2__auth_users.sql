create table if not exists app_users (
    id bigserial primary key,
    email varchar(180) not null unique,
    password_hash varchar(255) not null,
    profile varchar(20) not null
);
