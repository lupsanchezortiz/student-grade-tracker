# Northside Unified — student information

A district student information system: the **district office** owns the school year, grade scales, and bilingual report-card templates. Each **school site** enrolls its own students, opens courses from those templates, and keeps a spreadsheet gradebook (students as rows, report-card items as columns). Teachers print English or Spanish cards from those marks — either a built-in PDF or a PowerSchool-style HTML document.

## Roles

| Role | What they do |
| --- | --- |
| System admin | Schools, school years, grade scales, report-card templates (EN/ES), CSV import for any school, template line-item import |
| Site admin | Students, staff, courses, and attendance (CSV for this school only), enrollment, teacher permissions |
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
| `priya.shah@maple.northside.edu` | `demo` | Homeroom teacher, Kindergarten and Grade 3, Maple |
| `jordan.lee@maple.northside.edu` | `demo` | Specialist teacher (PE, art, specials), Maple |
| `lena.cho@cedar.northside.edu` | `demo` | Site admin, Cedar Ridge K–8 |

## Supabase (optional)

1. Create a project and copy URL + anon key into `.env.local` (see `.env.example`).
2. Run the SQL files in [`supabase/migrations`](supabase/migrations) in order.
3. Run [`supabase/seed.sql`](supabase/seed.sql) for the district catalog.
4. Create Auth users and set `profiles.is_system_admin` / `site_memberships` to match.

Without those env vars, demo mode stays on so you can use the product immediately.

## How a gradebook is created

1. District creates a school year and its grading periods (trimester, semester, or quarter).
2. District creates grade scales and a report-card template for one language and one grading-period type. School year is not stored on the template — `{{SCHOOL}}` and `{{YEAR}}` fill from the course.
3. District assigns the template to grade levels, sets a scale on each mark item, and publishes it.
4. The site creates a course for that grade and year. Only a published card whose grading periods match the year will attach.
5. The site enrolls students and grants teachers grade/print permission. Mark a template section as specialist-entered so homeroom can view those columns but not change them; assign that section to the specialist on the course.
6. Homeroom teachers enter classroom marks. Specialist teachers enter specials (PE, art, and the rest). Site administrators load absences and tardies from CSV; the gradebook Attendance tab is view-only for teachers. Print uses the template HTML (all terms) or the built-in PDF if HTML is empty.

## HTML documents (PowerSchool-style)

Each template is **one language** with its own HTML. Build English first, then **Create language version** for Spanish (or later, another language). Teachers grade the course template; print can use a published sibling document and the same marks (matched by line number).

System admins paste HTML on that language’s template. Merge tags fill from the gradebook:

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
- Attendance: `site_code,student_number,year,term,absences,tardies`
  `term` is `1` / `2` / `3` or the period name (Trimester 2). Optional `course` limits the row to one class.
- Template items (on the template): `list_item_eng,list_item_span,grade_scale,mark/comment,print_code,char`
  Also accepts `section_en,section_es,title_en,title_es,type,scale,max_chars`.
  `print_code` is the line number (`01`). HTML tags become `{{101}}` `{{201}}` `{{301}}` (and `{{401}}` for quarters).
  `mark/comment` is `m` or `c`. `grade_scale` of `1,2,3,4` or `1-4` is stored on that line item; `Comment` is ignored.
  `char` applies to comments only. Missing section columns default to Line items / Criterios.
  An English template reads `list_item_eng`; a Spanish template reads `list_item_span`.

A `scale` of `1-4` or `1,2,3,4` creates a 1 (lowest) through 4 (highest) scale. Comment rows can set `char` / `max_chars`.

Report-card templates include a **style panel**: custom title/footer copy (EN/ES), type size, page and table colors, criterion vs mark column width, and header field visibility. The live preview and the printed PDF use the same saved `layout`.
