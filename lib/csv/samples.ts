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

export const SAMPLE_ATTENDANCE = `site_code,student_number,year,term,absences,tardies
MPL,20260021,2026–27,2,1,0
MPL,20260022,2026–27,2,0,2
`;

export const SAMPLE_TEMPLATE_ITEMS = `list_item_eng,list_item_span,grade_scale,mark/comment,print_code,char
Names uppercase letters,Nombra letras mayúsculas,"1,2,3,4",m,01,1
Names lowercase letters,Nombra letras minúsculas,"1,2,3,4",m,02,1
Produces 1 to 1 letter sound correspondences for each letter,Produce correspondencias de sonido de 1 a 1 para cada letra,"1,2,3,4",m,03,1
"Identifies beginning, middle, ending sounds of a spoken word","Identifica sonidos iniciales, medios y finales de una palabra hablada","1,2,3,4",m,04,1
Demonstrates understanding of rhyming words,Demuestra comprensión de las palabras que riman,"1,2,3,4",m,05,1
Demonstrates understanding of blending and segmenting,Demuestra comprensión de la combinación y segmentación de sonidos,"1,2,3,4",m,06,1
Reads common high frequency words by sight,Lee palabras comunes de alta frecuencia a simple vista,"1,2,3,4",m,07,1
Teacher Comments,Comentarios del maestro,Comment,c,08,500
`;

export const SAMPLES = {
  students: SAMPLE_STUDENTS,
  staff: SAMPLE_STAFF,
  courses: SAMPLE_COURSES,
  attendance: SAMPLE_ATTENDANCE,
  template_items: SAMPLE_TEMPLATE_ITEMS,
} as const;

export type ImportKind = keyof typeof SAMPLES;
