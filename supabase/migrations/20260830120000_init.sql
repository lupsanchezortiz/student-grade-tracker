-- Northside SIS schema + RLS
create extension if not exists "pgcrypto";

create type public.term_structure as enum ('semester', 'trimester', 'quarter');
create type public.template_status as enum ('draft', 'published');
create type public.item_type as enum ('mark', 'comment');
create type public.site_role as enum ('site_admin', 'teacher');
create type public.locale_code as enum ('en', 'es');

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  address text not null default '',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  is_system_admin boolean not null default false
);

create table public.site_memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  role public.site_role not null,
  unique (profile_id, site_id)
);

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  term_structure public.term_structure not null
);

create table public.terms (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years (id) on delete cascade,
  sort_order int not null,
  name_en text not null,
  name_es text not null,
  start_date date not null,
  end_date date not null
);

create table public.grade_levels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_en text not null,
  name_es text not null,
  sort_order int not null
);

create table public.grade_scales (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table public.grade_scale_marks (
  id uuid primary key default gen_random_uuid(),
  scale_id uuid not null references public.grade_scales (id) on delete cascade,
  code text not null,
  label_en text not null,
  label_es text not null,
  sort_order int not null,
  is_passing boolean not null default true
);

create table public.report_card_templates (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years (id) on delete cascade,
  grade_scale_id uuid not null references public.grade_scales (id),
  name text not null,
  status public.template_status not null default 'draft'
);

create table public.template_grade_levels (
  template_id uuid not null references public.report_card_templates (id) on delete cascade,
  grade_level_id uuid not null references public.grade_levels (id) on delete cascade,
  primary key (template_id, grade_level_id)
);

create table public.template_sections (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.report_card_templates (id) on delete cascade,
  sort_order int not null,
  title_en text not null,
  title_es text not null
);

create table public.template_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.template_sections (id) on delete cascade,
  sort_order int not null,
  title_en text not null,
  title_es text not null,
  item_type public.item_type not null
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  student_number text not null,
  first_name text not null,
  last_name text not null,
  preferred_name text not null default '',
  grade_level_id uuid not null references public.grade_levels (id),
  home_language public.locale_code not null default 'en',
  unique (site_id, student_number)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  academic_year_id uuid not null references public.academic_years (id),
  grade_level_id uuid not null references public.grade_levels (id),
  template_id uuid not null references public.report_card_templates (id),
  name text not null
);

create table public.course_teachers (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  can_grade boolean not null default true,
  can_print boolean not null default true,
  unique (course_id, profile_id)
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  unique (course_id, student_id)
);

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  term_id uuid not null references public.terms (id) on delete cascade,
  template_item_id uuid not null references public.template_items (id) on delete cascade,
  mark_id uuid references public.grade_scale_marks (id),
  comment text not null default '',
  unique (enrollment_id, term_id, template_item_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, is_system_admin)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'Staff'),
    false
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_system_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_system_admin
  );
$$;

create or replace function public.has_site_role(target_site uuid, roles public.site_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.site_memberships m
    where m.profile_id = auth.uid()
      and m.site_id = target_site
      and m.role = any(roles)
  );
$$;

create or replace function public.can_grade_course(target_course uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_system_admin()
    or exists (
      select 1
      from public.courses c
      join public.site_memberships m
        on m.site_id = c.site_id
       and m.profile_id = auth.uid()
       and m.role = 'site_admin'
      where c.id = target_course
    )
    or exists (
      select 1 from public.course_teachers t
      where t.course_id = target_course
        and t.profile_id = auth.uid()
        and t.can_grade
    );
$$;

alter table public.sites enable row level security;
alter table public.profiles enable row level security;
alter table public.site_memberships enable row level security;
alter table public.academic_years enable row level security;
alter table public.terms enable row level security;
alter table public.grade_levels enable row level security;
alter table public.grade_scales enable row level security;
alter table public.grade_scale_marks enable row level security;
alter table public.report_card_templates enable row level security;
alter table public.template_grade_levels enable row level security;
alter table public.template_sections enable row level security;
alter table public.template_items enable row level security;
alter table public.students enable row level security;
alter table public.courses enable row level security;
alter table public.course_teachers enable row level security;
alter table public.enrollments enable row level security;
alter table public.grades enable row level security;

-- Authenticated staff can read district catalog
create policy "catalog_read" on public.academic_years for select to authenticated using (true);
create policy "catalog_read" on public.terms for select to authenticated using (true);
create policy "catalog_read" on public.grade_levels for select to authenticated using (true);
create policy "catalog_read" on public.grade_scales for select to authenticated using (true);
create policy "catalog_read" on public.grade_scale_marks for select to authenticated using (true);
create policy "catalog_read" on public.report_card_templates for select to authenticated using (true);
create policy "catalog_read" on public.template_grade_levels for select to authenticated using (true);
create policy "catalog_read" on public.template_sections for select to authenticated using (true);
create policy "catalog_read" on public.template_items for select to authenticated using (true);

create policy "district_write_years" on public.academic_years for all to authenticated
  using (public.is_system_admin()) with check (public.is_system_admin());
create policy "district_write_terms" on public.terms for all to authenticated
  using (public.is_system_admin()) with check (public.is_system_admin());
create policy "district_write_scales" on public.grade_scales for all to authenticated
  using (public.is_system_admin()) with check (public.is_system_admin());
create policy "district_write_marks" on public.grade_scale_marks for all to authenticated
  using (public.is_system_admin()) with check (public.is_system_admin());
create policy "district_write_templates" on public.report_card_templates for all to authenticated
  using (public.is_system_admin()) with check (public.is_system_admin());
create policy "district_write_tgl" on public.template_grade_levels for all to authenticated
  using (public.is_system_admin()) with check (public.is_system_admin());
create policy "district_write_sections" on public.template_sections for all to authenticated
  using (public.is_system_admin()) with check (public.is_system_admin());
create policy "district_write_items" on public.template_items for all to authenticated
  using (public.is_system_admin()) with check (public.is_system_admin());
create policy "district_write_levels" on public.grade_levels for all to authenticated
  using (public.is_system_admin()) with check (public.is_system_admin());

create policy "sites_read" on public.sites for select to authenticated
  using (public.is_system_admin() or public.has_site_role(id, array['site_admin','teacher']::public.site_role[]));
create policy "sites_write" on public.sites for all to authenticated
  using (public.is_system_admin()) with check (public.is_system_admin());

create policy "profiles_self" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_system_admin());
create policy "profiles_staff" on public.profiles for select to authenticated
  using (exists (
    select 1 from public.site_memberships mine
    join public.site_memberships theirs on theirs.site_id = mine.site_id
    where mine.profile_id = auth.uid() and theirs.profile_id = profiles.id
  ));
create policy "profiles_update_self" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and is_system_admin is not distinct from (select is_system_admin from public.profiles p where p.id = auth.uid()));

create policy "memberships_read" on public.site_memberships for select to authenticated
  using (
    public.is_system_admin()
    or profile_id = auth.uid()
    or public.has_site_role(site_id, array['site_admin','teacher']::public.site_role[])
  );
create policy "memberships_write" on public.site_memberships for all to authenticated
  using (public.is_system_admin() or public.has_site_role(site_id, array['site_admin']::public.site_role[]))
  with check (public.is_system_admin() or public.has_site_role(site_id, array['site_admin']::public.site_role[]));

create policy "students_read" on public.students for select to authenticated
  using (public.is_system_admin() or public.has_site_role(site_id, array['site_admin','teacher']::public.site_role[]));
create policy "students_write" on public.students for all to authenticated
  using (public.is_system_admin() or public.has_site_role(site_id, array['site_admin']::public.site_role[]))
  with check (public.is_system_admin() or public.has_site_role(site_id, array['site_admin']::public.site_role[]));

create policy "courses_read" on public.courses for select to authenticated
  using (
    public.is_system_admin()
    or public.has_site_role(site_id, array['site_admin','teacher']::public.site_role[])
  );
create policy "courses_write" on public.courses for all to authenticated
  using (public.is_system_admin() or public.has_site_role(site_id, array['site_admin']::public.site_role[]))
  with check (public.is_system_admin() or public.has_site_role(site_id, array['site_admin']::public.site_role[]));

create policy "course_teachers_read" on public.course_teachers for select to authenticated
  using (exists (select 1 from public.courses c where c.id = course_id and (
    public.is_system_admin() or public.has_site_role(c.site_id, array['site_admin','teacher']::public.site_role[])
  )));
create policy "course_teachers_write" on public.course_teachers for all to authenticated
  using (exists (select 1 from public.courses c where c.id = course_id and (
    public.is_system_admin() or public.has_site_role(c.site_id, array['site_admin']::public.site_role[])
  )))
  with check (exists (select 1 from public.courses c where c.id = course_id and (
    public.is_system_admin() or public.has_site_role(c.site_id, array['site_admin']::public.site_role[])
  )));

create policy "enrollments_read" on public.enrollments for select to authenticated
  using (exists (select 1 from public.courses c where c.id = course_id and (
    public.is_system_admin() or public.has_site_role(c.site_id, array['site_admin','teacher']::public.site_role[])
  )));
create policy "enrollments_write" on public.enrollments for all to authenticated
  using (exists (select 1 from public.courses c where c.id = course_id and (
    public.is_system_admin() or public.has_site_role(c.site_id, array['site_admin']::public.site_role[])
  )))
  with check (exists (select 1 from public.courses c where c.id = course_id and (
    public.is_system_admin() or public.has_site_role(c.site_id, array['site_admin']::public.site_role[])
  )));

create policy "grades_read" on public.grades for select to authenticated
  using (exists (
    select 1 from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.id = enrollment_id and (
      public.is_system_admin()
      or public.has_site_role(c.site_id, array['site_admin','teacher']::public.site_role[])
    )
  ));
create policy "grades_write" on public.grades for all to authenticated
  using (exists (
    select 1 from public.enrollments e
    where e.id = enrollment_id and public.can_grade_course(e.course_id)
  ))
  with check (exists (
    select 1 from public.enrollments e
    where e.id = enrollment_id and public.can_grade_course(e.course_id)
  ));
