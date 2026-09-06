alter table public.report_card_templates
  add column if not exists term_structure public.term_structure not null default 'trimester';

alter table public.template_items
  add column if not exists grade_scale_id uuid references public.grade_scales (id);

update public.template_items as item
set grade_scale_id = template.grade_scale_id
from public.template_sections as section
join public.report_card_templates as template on template.id = section.template_id
where item.section_id = section.id
  and item.item_type = 'mark'
  and item.grade_scale_id is null
  and template.grade_scale_id is not null;
