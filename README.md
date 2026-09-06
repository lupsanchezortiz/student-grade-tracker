# Northside Unified — student information

A district student information system: the **district office** owns the school year, grade scales, and bilingual report-card templates. Each **school site** enrolls its own students, opens courses from those templates, and keeps a spreadsheet gradebook (students as rows, report-card items as columns). Teachers print English or Spanish PDF report cards from the same marks.

## Roles

| Role | What they do |
| --- | --- |
| System admin | Schools, school years, grade scales, report-card templates (EN/ES), CSV import for any school, template line-item import |
| Site admin | Students, staff, courses (including CSV for this school only), enrollment, teacher permissions |
| Teacher | Grade assigned courses, print report cards |

## Run locally

```bash
pnpm install
pnpm dev
```

Opens at [http://127.0.0.1:43147](http://127.0.0.1:43147).

With no Supabase env vars the app runs in **demo mode** (file-backed store in `.data/store.json`).

| Email | Password | Role |
| --- | --- | --- |
| `elena.voss@northside.edu` | `demo` | System admin |
| `marco.santos@maple.northside.edu` | `demo` | Site admin, Maple Elementary |
| `priya.shah@maple.northside.edu` | `demo` | Grade 3 teacher, Maple |
| `lena.cho@cedar.northside.edu` | `demo` | Site admin, Cedar Ridge K–8 |

## Supabase (optional)

1. Create a project and copy URL + anon key into `.env.local` (see `.env.example`).
2. Run the SQL files in [`supabase/migrations`](supabase/migrations) in order (init, import/layout, then report-card styles).
3. Run [`supabase/seed.sql`](supabase/seed.sql) for the district catalog.
4. Create Auth users and set `profiles.is_system_admin` / `site_memberships` to match.

Without those env vars, demo mode stays on so you can use the product immediately.

## How a gradebook is created

1. District creates a school year and term structure.
2. District creates a grade scale and a report-card template (what is graded, EN + ES).
3. District assigns the template to grade levels and publishes it.
4. The site creates a course for that grade and year — the template becomes the gradebook columns.
5. The site enrolls students and grants teachers grade/print permission.
6. Teachers enter marks; PDFs render in English or Spanish from those marks.

## CSV import

District **CSV import** (system admin) and site Students / Staff / Courses pages (site admin) accept uploads. Download the sample file first. Matching keys update instead of duplicating.

- Students: `site_code,student_number,first_name,last_name,preferred_name,grade,home_language`
- Staff: `site_code,full_name,email,role`
- Courses: `site_code,year,grade,name,teacher_email`
- Template items (on the template): `section_en,section_es,title_en,title_es,type,scale,max_chars`

A `scale` of `1-4` creates a 1 (lowest) through 4 (highest) scale. Comment rows such as `ILP Goal` can set `max_chars`.

Report-card templates include a **style panel**: custom title/footer copy (EN/ES), type size, page and table colors, criterion vs mark column width, and header field visibility. The live preview and the printed PDF use the same saved `layout`.
