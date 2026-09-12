-- roles
create type public.app_role as enum ('admin', 'viewer');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "authenticated can read roles" on public.user_roles for select to authenticated using (true);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- assigns a role to the calling user: first ever user becomes admin, others viewer
create or replace function public.ensure_my_role()
returns public.app_role language plpgsql security definer set search_path = public as $$
declare existing public.app_role;
declare assigned public.app_role;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select role into existing from public.user_roles where user_id = auth.uid() limit 1;
  if existing is not null then
    return existing;
  end if;
  if exists (select 1 from public.user_roles where role = 'admin') then
    assigned := 'viewer';
  else
    assigned := 'admin';
  end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), assigned)
  on conflict (user_id, role) do nothing;
  return assigned;
end;
$$;
grant execute on function public.ensure_my_role() to authenticated;

-- profiles
create table public.profiles (
  id uuid primary key,
  display_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "read profiles" on public.profiles for select to authenticated using (true);
create policy "insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update to authenticated using (auth.uid() = id);

-- events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  location text,
  notes text,
  completed boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "authenticated can read events" on public.events for select to authenticated using (true);
create policy "admins insert events" on public.events for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "admins update events" on public.events for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admins delete events" on public.events for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create index events_starts_at_idx on public.events (starts_at);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger events_touch_updated_at before update on public.events
for each row execute function public.touch_updated_at();

-- extra reminders
create table public.event_reminders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  remind_at timestamptz not null,
  label text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.event_reminders to authenticated;
grant all on public.event_reminders to service_role;
alter table public.event_reminders enable row level security;
create policy "authenticated can read reminders" on public.event_reminders for select to authenticated using (true);
create policy "admins insert reminders" on public.event_reminders for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "admins update reminders" on public.event_reminders for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admins delete reminders" on public.event_reminders for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create index event_reminders_event_idx on public.event_reminders (event_id);

alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.event_reminders;