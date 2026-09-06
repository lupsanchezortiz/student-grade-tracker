# Northside Unified — student information

A district student information system: the **district office** owns the school year, grade scales, and bilingual report-card templates. Each **school site** enrolls its own students, opens courses from those templates, and keeps a spreadsheet gradebook (students as rows, report-card items as columns). Teachers print English or Spanish cards from those marks — either a built-in PDF or a PowerSchool-style HTML document.

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
| `priya.shah@maple.northside.edu` | `demo` | Kindergarten and Grade 3 teacher, Maple |
| `lena.cho@cedar.northside.edu` | `demo` | Site admin, Cedar Ridge K–8 |

## Supabase (optional)

1. Create a project and copy URL + anon key into `.env.local` (see `.env.example`).
2. Run the SQL files in [`supabase/migrations`](supabase/migrations) in order.
3. Run [`supabase/seed.sql`](supabase/seed.sql) for the district catalog.
4. Create Auth users and set `profiles.is_system_admin` / `site_memberships` to match.

Without those env vars, demo mode stays on so you can use the product immediately.

## How a gradebook is created

1. District creates a school year and term structure.
2. District creates a grade scale and a report-card template (what is graded, EN + ES).
3. District assigns the template to grade levels and publishes it.
4. The site creates a course for that grade and year — the template becomes the gradebook columns.
5. The site enrolls students and grants teachers grade/print permission.
6. Teachers enter marks and attendance; print uses the template HTML (all terms) or the built-in PDF if HTML is empty.

## HTML documents (PowerSchool-style)

System admins paste HTML on a template. Merge tags fill from the gradebook:

- `{{STUDENT_NAME}}`, `{{STUDENT_ID}}`, `{{GRADE}}`, `{{SCHOOL}}`, `{{YEAR}}`, `{{TEACHER_NAME}}`
- `{{101}}` / `{{201}}` / `{{301}}` — line number `01` in terms 1–3 (quarters also use `{{401}}`)
- `{{1A}}` `{{1T}}` — absences and tardies
- `{{ILP_GOAL_TEXT}}`, `{{FALL_COMMENTS}}`, `{{WINTER_COMMENTS}}`, `{{SPRING_COMMENTS}}`

CSV `print_code` is the short line number (`01`, `08`, or a named code). The HTML document uses `termIndex × 100 + line` so a trimester item `01` fills `{{101}} {{201}} {{301}}`.

The demo includes a **Kindergarten standards report** built from a letter-size HTML file (line numbers 01–47 as tags 101–147). Grade 3 still uses the built-in PDF unless you add HTML.

Scripts and event handlers are stripped on save. Teachers do not edit HTML.

## CSV import

District **CSV import** (system admin) and site Students / Staff / Courses pages (site admin) accept uploads. Download the sample file first. Matching keys update instead of duplicating.

- Students: `site_code,student_number,first_name,last_name,preferred_name,grade,home_language`
- Staff: `site_code,full_name,email,role`
- Courses: `site_code,year,grade,name,teacher_email`
- Template items (on the template): `list_item_eng,list_item_span,grade_scale,mark/comment,print_code,char`
  Also accepts `section_en,section_es,title_en,title_es,type,scale,max_chars`.
  `print_code` is the line number (`01`). HTML tags become `{{101}}` `{{201}}` `{{301}}` (and `{{401}}` for quarters).
  `mark/comment` is `m` or `c`. `grade_scale` of `1,2,3,4` or `1-4` sets a 1–4 scale; `Comment` is ignored.
  `char` applies to comments only. Missing section columns default to Line items / Criterios.

A `scale` of `1-4` or `1,2,3,4` creates a 1 (lowest) through 4 (highest) scale. Comment rows can set `char` / `max_chars`.

Report-card templates include a **style panel**: custom title/footer copy (EN/ES), type size, page and table colors, criterion vs mark column width, and header field visibility. The live preview and the printed PDF use the same saved `layout`.
