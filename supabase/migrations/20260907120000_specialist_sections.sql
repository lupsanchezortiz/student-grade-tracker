alter table public.template_sections
  add column if not exists graded_by text not null default 'homeroom'
    check (graded_by in ('homeroom', 'specialist'));

alter table public.course_teachers
  add column if not exists grades_homeroom boolean not null default true;

alter table public.course_teachers
  add column if not exists section_ids text[] not null default '{}';
