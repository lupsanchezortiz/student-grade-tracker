alter table public.template_items
  add column if not exists max_chars int;

alter table public.report_card_templates
  add column if not exists layout jsonb not null default '{
    "headerFields":{"student":true,"id":true,"grade":true,"school":true,"term":true,"year":true,"course":true},
    "commentsPlacement":"inline",
    "table":{"showMarkCode":true,"showMarkLabel":true,"density":"compact","markColumnWidth":"narrow"}
  }'::jsonb;
