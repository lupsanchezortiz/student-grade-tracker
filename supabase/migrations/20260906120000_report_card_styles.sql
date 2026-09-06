-- Style-panel defaults for report-card layout JSON.
-- Existing rows keep their saved layout; the app normalizes missing keys.
alter table public.report_card_templates
  alter column layout set default '{
    "headerFields":{"student":true,"id":true,"grade":true,"school":true,"term":true,"year":true,"course":true},
    "commentsPlacement":"inline",
    "copy":{"titleEn":"","titleEs":"","footerEn":"","footerEs":""},
    "type":{"titleSize":"md","bodySize":"md"},
    "colors":{"page":"#f7f4ee","ink":"#1f2a44","band":"#eef2f7","border":"#c9d0dc","accent":"#3d4f7a"},
    "table":{"showMarkCode":true,"showMarkLabel":true,"density":"compact","markColumnWidth":"narrow","criterionWidth":70,"showOuterBorder":false}
  }'::jsonb;
