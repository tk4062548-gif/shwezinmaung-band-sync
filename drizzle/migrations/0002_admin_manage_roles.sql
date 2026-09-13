create or replace function public.count_admins()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer from public.user_roles where role = 'admin'
$$;

create policy "admins insert roles"
on public.user_roles
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "admins delete roles except last admin"
on public.user_roles
for delete
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  and (role = 'viewer' or public.count_admins() > 1)
);