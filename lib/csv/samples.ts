export const SAMPLE_STUDENTS = `site_code,student_number,first_name,last_name,preferred_name,grade,home_language
MPL,20260010,Ava,Kim,Ava,3,en
MPL,20260011,Diego,Morales,Diego,3,es
`;

export const SAMPLE_STAFF = `site_code,full_name,email,role
MPL,Jordan Lee,jordan.lee@maple.northside.edu,teacher
MPL,Sam Ortiz,sam.ortiz@maple.northside.edu,site_admin
`;

export const SAMPLE_COURSES = `site_code,year,grade,name,teacher_email
MPL,2026–27,3,Grade 3 Homeroom — Lee,jordan.lee@maple.northside.edu
`;

export const SAMPLE_TEMPLATE_ITEMS = `section_en,section_es,title_en,title_es,type,scale,max_chars
Language arts,Artes del lenguaje,Reading,Lectura,mark,1-4,
Language arts,Artes del lenguaje,Writing,Escritura,mark,1-4,
Teacher comments,Comentarios,ILP Goal,Meta del PIL,comment,,500
`;

export const SAMPLES = {
  students: SAMPLE_STUDENTS,
  staff: SAMPLE_STAFF,
  courses: SAMPLE_COURSES,
  template_items: SAMPLE_TEMPLATE_ITEMS,
} as const;

export type ImportKind = keyof typeof SAMPLES;
