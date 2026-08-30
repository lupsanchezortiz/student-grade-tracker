-- District catalog seed. Create Auth users in the dashboard first, then
-- update public.profiles.is_system_admin / site_memberships to match those ids.
-- This file seeds sites, calendar, scale, template, and sample students.

insert into public.grade_levels (id, code, name_en, name_es, sort_order) values
  ('aaaaaaaa-0000-4000-8000-00000000000k', 'K', 'Kindergarten', 'Kinder', 0),
  ('aaaaaaaa-0000-4000-8000-000000000001', '1', 'Grade 1', '1.° grado', 1),
  ('aaaaaaaa-0000-4000-8000-000000000002', '2', 'Grade 2', '2.° grado', 2),
  ('aaaaaaaa-0000-4000-8000-000000000003', '3', 'Grade 3', '3.° grado', 3),
  ('aaaaaaaa-0000-4000-8000-000000000004', '4', 'Grade 4', '4.° grado', 4),
  ('aaaaaaaa-0000-4000-8000-000000000005', '5', 'Grade 5', '5.° grado', 5),
  ('aaaaaaaa-0000-4000-8000-000000000006', '6', 'Grade 6', '6.° grado', 6),
  ('aaaaaaaa-0000-4000-8000-000000000007', '7', 'Grade 7', '7.° grado', 7),
  ('aaaaaaaa-0000-4000-8000-000000000008', '8', 'Grade 8', '8.° grado', 8),
  ('aaaaaaaa-0000-4000-8000-000000000009', '9', 'Grade 9', '9.° grado', 9),
  ('aaaaaaaa-0000-4000-8000-000000000010', '10', 'Grade 10', '10.° grado', 10),
  ('aaaaaaaa-0000-4000-8000-000000000011', '11', 'Grade 11', '11.° grado', 11),
  ('aaaaaaaa-0000-4000-8000-000000000012', '12', 'Grade 12', '12.° grado', 12)
on conflict (id) do nothing;

insert into public.sites (id, name, code, address) values
  ('11111111-1111-4111-8111-111111111111', 'Maple Elementary', 'MPL', '1400 Maple Avenue, Northside'),
  ('11111111-1111-4111-8111-111111111112', 'Cedar Ridge K–8', 'CDR', '88 Ridge Road, Northside')
on conflict (id) do nothing;

insert into public.academic_years (id, name, start_date, end_date, term_structure) values
  ('22222222-2222-4222-8222-222222222221', '2026–27', '2026-08-17', '2027-06-11', 'trimester')
on conflict (id) do nothing;

insert into public.terms (id, academic_year_id, sort_order, name_en, name_es, start_date, end_date) values
  ('33333333-3333-4333-8333-333333333331', '22222222-2222-4222-8222-222222222221', 1, 'Trimester 1', 'Trimestre 1', '2026-08-17', '2026-11-13'),
  ('33333333-3333-4333-8333-333333333332', '22222222-2222-4222-8222-222222222221', 2, 'Trimester 2', 'Trimestre 2', '2026-11-16', '2027-03-05'),
  ('33333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222221', 3, 'Trimester 3', 'Trimestre 3', '2027-03-08', '2027-06-11')
on conflict (id) do nothing;

insert into public.grade_scales (id, name) values
  ('44444444-4444-4444-8444-444444444441', 'E / S / N / U')
on conflict (id) do nothing;

insert into public.grade_scale_marks (id, scale_id, code, label_en, label_es, sort_order, is_passing) values
  ('44444444-4444-4444-8444-444444444442', '44444444-4444-4444-8444-444444444441', 'E', 'Exceeds', 'Sobresaliente', 1, true),
  ('44444444-4444-4444-8444-444444444443', '44444444-4444-4444-8444-444444444441', 'S', 'Satisfactory', 'Satisfactorio', 2, true),
  ('44444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444441', 'N', 'Needs improvement', 'Necesita mejorar', 3, true),
  ('44444444-4444-4444-8444-444444444445', '44444444-4444-4444-8444-444444444441', 'U', 'Unsatisfactory', 'Insatisfactorio', 4, false)
on conflict (id) do nothing;

insert into public.report_card_templates (id, academic_year_id, grade_scale_id, name, status) values
  ('55555555-5555-4555-8555-555555555551', '22222222-2222-4222-8222-222222222221', '44444444-4444-4444-8444-444444444441', 'Elementary progress report', 'published')
on conflict (id) do nothing;

insert into public.template_grade_levels (template_id, grade_level_id) values
  ('55555555-5555-4555-8555-555555555551', 'aaaaaaaa-0000-4000-8000-00000000000k'),
  ('55555555-5555-4555-8555-555555555551', 'aaaaaaaa-0000-4000-8000-000000000001'),
  ('55555555-5555-4555-8555-555555555551', 'aaaaaaaa-0000-4000-8000-000000000002'),
  ('55555555-5555-4555-8555-555555555551', 'aaaaaaaa-0000-4000-8000-000000000003'),
  ('55555555-5555-4555-8555-555555555551', 'aaaaaaaa-0000-4000-8000-000000000004'),
  ('55555555-5555-4555-8555-555555555551', 'aaaaaaaa-0000-4000-8000-000000000005')
on conflict do nothing;

insert into public.template_sections (id, template_id, sort_order, title_en, title_es) values
  ('55555555-5555-4555-8555-555555555561', '55555555-5555-4555-8555-555555555551', 1, 'Language arts', 'Artes del lenguaje'),
  ('55555555-5555-4555-8555-555555555562', '55555555-5555-4555-8555-555555555551', 2, 'Mathematics', 'Matemáticas'),
  ('55555555-5555-4555-8555-555555555563', '55555555-5555-4555-8555-555555555551', 3, 'Science', 'Ciencias'),
  ('55555555-5555-4555-8555-555555555564', '55555555-5555-4555-8555-555555555551', 4, 'Social studies', 'Estudios sociales'),
  ('55555555-5555-4555-8555-555555555565', '55555555-5555-4555-8555-555555555551', 5, 'Work habits', 'Hábitos de trabajo'),
  ('55555555-5555-4555-8555-555555555566', '55555555-5555-4555-8555-555555555551', 6, 'Teacher comments', 'Comentarios del maestro')
on conflict (id) do nothing;

insert into public.template_items (id, section_id, sort_order, title_en, title_es, item_type) values
  ('55555555-5555-4555-8555-555555555571', '55555555-5555-4555-8555-555555555561', 1, 'Reading', 'Lectura', 'mark'),
  ('55555555-5555-4555-8555-555555555572', '55555555-5555-4555-8555-555555555561', 2, 'Writing', 'Escritura', 'mark'),
  ('55555555-5555-4555-8555-555555555573', '55555555-5555-4555-8555-555555555561', 3, 'Speaking and listening', 'Hablar y escuchar', 'mark'),
  ('55555555-5555-4555-8555-555555555574', '55555555-5555-4555-8555-555555555562', 1, 'Number sense', 'Sentido numérico', 'mark'),
  ('55555555-5555-4555-8555-555555555575', '55555555-5555-4555-8555-555555555562', 2, 'Operations', 'Operaciones', 'mark'),
  ('55555555-5555-4555-8555-555555555576', '55555555-5555-4555-8555-555555555562', 3, 'Measurement and data', 'Medición y datos', 'mark'),
  ('55555555-5555-4555-8555-555555555577', '55555555-5555-4555-8555-555555555563', 1, 'Scientific thinking', 'Pensamiento científico', 'mark'),
  ('55555555-5555-4555-8555-555555555578', '55555555-5555-4555-8555-555555555564', 1, 'Community and history', 'Comunidad e historia', 'mark'),
  ('55555555-5555-4555-8555-555555555579', '55555555-5555-4555-8555-555555555565', 1, 'Completes work on time', 'Completa el trabajo a tiempo', 'mark'),
  ('55555555-5555-4555-8555-55555555557a', '55555555-5555-4555-8555-555555555565', 2, 'Works cooperatively', 'Trabaja en cooperación', 'mark'),
  ('55555555-5555-4555-8555-55555555557b', '55555555-5555-4555-8555-555555555565', 3, 'Follows directions', 'Sigue instrucciones', 'mark'),
  ('55555555-5555-4555-8555-55555555557c', '55555555-5555-4555-8555-555555555566', 1, 'Comments', 'Comentarios', 'comment')
on conflict (id) do nothing;

insert into public.students (id, site_id, student_number, first_name, last_name, preferred_name, grade_level_id, home_language) values
  ('77777777-7777-4777-8777-000000000001', '11111111-1111-4111-8111-111111111111', '20260001', 'Sofia', 'Alvarez', 'Sofia', 'aaaaaaaa-0000-4000-8000-000000000003', 'es'),
  ('77777777-7777-4777-8777-000000000002', '11111111-1111-4111-8111-111111111111', '20260002', 'Mateo', 'Chen', 'Mateo', 'aaaaaaaa-0000-4000-8000-000000000003', 'en'),
  ('77777777-7777-4777-8777-000000000003', '11111111-1111-4111-8111-111111111111', '20260003', 'Amara', 'Diallo', 'Amara', 'aaaaaaaa-0000-4000-8000-000000000003', 'en'),
  ('77777777-7777-4777-8777-000000000004', '11111111-1111-4111-8111-111111111111', '20260004', 'Noah', 'Patel', 'Noah', 'aaaaaaaa-0000-4000-8000-000000000003', 'en'),
  ('77777777-7777-4777-8777-000000000005', '11111111-1111-4111-8111-111111111111', '20260005', 'Lucia', 'Romero', 'Lucia', 'aaaaaaaa-0000-4000-8000-000000000003', 'es'),
  ('77777777-7777-4777-8777-000000000006', '11111111-1111-4111-8111-111111111111', '20260006', 'Ethan', 'Brooks', 'Ethan', 'aaaaaaaa-0000-4000-8000-000000000003', 'en')
on conflict (id) do nothing;
