alter table app_users
    add column member_id bigint;

alter table app_users
    add constraint fk_app_users_member
        foreign key (member_id) references members(id) on delete cascade;

alter table app_users
    add constraint uk_app_users_member unique (member_id);
