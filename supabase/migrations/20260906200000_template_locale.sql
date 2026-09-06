alter table public.report_card_templates
  add column if not exists locale public.locale_code not null default 'en',
  add column if not exists html text not null default '',
  add column if not exists source_template_id uuid references public.report_card_templates (id) on delete set null;

update public.report_card_templates
set html = coalesce(nullif(html, ''), html_en, '')
where html = '';
