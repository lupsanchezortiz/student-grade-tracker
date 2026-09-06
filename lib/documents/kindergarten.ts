import { readFileSync } from "fs";
import path from "path";
import { defaultLayout } from "@/lib/data/layout";
import { gradeLevelId, IDS } from "@/lib/ids";
import type {
  AttendanceRecord,
  Course,
  CourseTeacher,
  Enrollment,
  Grade,
  GradeScale,
  GradeScaleMark,
  StoreState,
  Student,
  TemplateGradeLevel,
  TemplateItem,
  TemplateSection,
} from "@/lib/types";

export function kindergartenHtmlEn(): string {
  return readFileSync(path.join(process.cwd(), "lib/documents/kindergarten-en.html"), "utf8");
}

type KinderItem = {
  id: string;
  printCode: string;
  titleEn: string;
  titleEs: string;
  itemType: "mark" | "comment";
  maxChars?: number;
};

type KinderSection = {
  id: string;
  titleEn: string;
  titleEs: string;
  items: KinderItem[];
};

export const KINDER_SECTIONS: KinderSection[] = [
  {
    id: "k-sec-ela",
    titleEn: "English language arts",
    titleEs: "Artes del lenguaje",
    items: [
      { id: "k-101", printCode: "101", titleEn: "Names uppercase letters", titleEs: "Nombra letras mayúsculas", itemType: "mark" },
      { id: "k-102", printCode: "102", titleEn: "Names lowercase letters", titleEs: "Nombra letras minúsculas", itemType: "mark" },
      { id: "k-103", printCode: "103", titleEn: "Produces letter-sound correspondences", titleEs: "Produce correspondencias letra-sonido", itemType: "mark" },
      { id: "k-104", printCode: "104", titleEn: "Identifies beginning, middle, ending sounds", titleEs: "Identifica sonidos inicial, medio y final", itemType: "mark" },
      { id: "k-105", printCode: "105", titleEn: "Demonstrates understanding of rhyming words", titleEs: "Comprende palabras que riman", itemType: "mark" },
      { id: "k-106", printCode: "106", titleEn: "Blending and segmenting", titleEs: "Fusiona y segmenta", itemType: "mark" },
      { id: "k-107", printCode: "107", titleEn: "Reads common high-frequency words", titleEs: "Lee palabras de alta frecuencia", itemType: "mark" },
      { id: "k-108", printCode: "108", titleEn: "Asks and answers questions", titleEs: "Hace y responde preguntas", itemType: "mark" },
      { id: "k-109", printCode: "109", titleEn: "Listens and takes turns", titleEs: "Escucha y espera su turno", itemType: "mark" },
      { id: "k-110", printCode: "110", titleEn: "Describes people, places, things, and events", titleEs: "Describe personas, lugares y eventos", itemType: "mark" },
      { id: "k-111", printCode: "111", titleEn: "Writing: Focus", titleEs: "Escritura: Enfoque", itemType: "mark" },
      { id: "k-112", printCode: "112", titleEn: "Writing: Organization", titleEs: "Escritura: Organización", itemType: "mark" },
      { id: "k-113", printCode: "113", titleEn: "Writing: Elaboration", titleEs: "Escritura: Elaboración", itemType: "mark" },
      { id: "k-114", printCode: "114", titleEn: "Writing: Language and vocabulary", titleEs: "Escritura: Lenguaje y vocabulario", itemType: "mark" },
      { id: "k-115", printCode: "115", titleEn: "Writing: Conventions", titleEs: "Escritura: Convenciones", itemType: "mark" },
      { id: "k-116", printCode: "116", titleEn: "Prints most upper and lower case letters", titleEs: "Escribe la mayoría de las letras", itemType: "mark" },
      { id: "k-117", printCode: "117", titleEn: "Spells simple words", titleEs: "Deletrea palabras sencillas", itemType: "mark" },
      { id: "k-118", printCode: "118", titleEn: "Uses words correctly when speaking or writing", titleEs: "Usa las palabras correctamente", itemType: "mark" },
      { id: "k-119", printCode: "119", titleEn: "Uses known sight words when writing", titleEs: "Usa palabras visuales al escribir", itemType: "mark" },
    ],
  },
  {
    id: "k-sec-math",
    titleEn: "Mathematics",
    titleEs: "Matemáticas",
    items: [
      { id: "k-120", printCode: "120", titleEn: "Identifies numbers 0–20", titleEs: "Identifica números 0–20", itemType: "mark" },
      { id: "k-121", printCode: "121", titleEn: "Writes numbers 0–20", titleEs: "Escribe números 0–20", itemType: "mark" },
      { id: "k-122", printCode: "122", titleEn: "Counts to 100 by ones", titleEs: "Cuenta hasta 100 de uno en uno", itemType: "mark" },
      { id: "k-123", printCode: "123", titleEn: "Counts to 100 by tens", titleEs: "Cuenta hasta 100 de diez en diez", itemType: "mark" },
      { id: "k-124", printCode: "124", titleEn: "Counts objects with 1:1 correspondence", titleEs: "Cuenta objetos uno a uno", itemType: "mark" },
      { id: "k-125", printCode: "125", titleEn: "Understands teen numbers as 10 and some more", titleEs: "Comprende los números adolescentes", itemType: "mark" },
      { id: "k-126", printCode: "126", titleEn: "Compares numbers and groups", titleEs: "Compara números y grupos", itemType: "mark" },
      { id: "k-127", printCode: "127", titleEn: "Addition is putting together", titleEs: "La suma es juntar", itemType: "mark" },
      { id: "k-128", printCode: "128", titleEn: "Subtraction is taking apart", titleEs: "La resta es quitar", itemType: "mark" },
      { id: "k-129", printCode: "129", titleEn: "Decomposes numbers to 10", titleEs: "Descompone números hasta 10", itemType: "mark" },
      { id: "k-130", printCode: "130", titleEn: "Shows how to make 10", titleEs: "Muestra cómo formar 10", itemType: "mark" },
      { id: "k-131", printCode: "131", titleEn: "Adds and subtracts within 5", titleEs: "Suma y resta hasta 5", itemType: "mark" },
      { id: "k-132", printCode: "132", titleEn: "Compares two things", titleEs: "Compara dos cosas", itemType: "mark" },
      { id: "k-133", printCode: "133", titleEn: "Sorts objects into groups", titleEs: "Clasifica objetos", itemType: "mark" },
      { id: "k-134", printCode: "134", titleEn: "Identifies and describes shapes", titleEs: "Identifica y describe figuras", itemType: "mark" },
      { id: "k-135", printCode: "135", titleEn: "Compares 2D and 3D shapes", titleEs: "Compara figuras 2D y 3D", itemType: "mark" },
      { id: "k-136", printCode: "136", titleEn: "Uses simple shapes to form larger shapes", titleEs: "Forma figuras más grandes", itemType: "mark" },
    ],
  },
  {
    id: "k-sec-specials",
    titleEn: "Special subjects",
    titleEs: "Especiales",
    items: [
      { id: "k-137", printCode: "137", titleEn: "Physical education", titleEs: "Educación física", itemType: "mark" },
      { id: "k-138", printCode: "138", titleEn: "Art", titleEs: "Arte", itemType: "mark" },
      { id: "k-139", printCode: "139", titleEn: "History and social studies", titleEs: "Historia y estudios sociales", itemType: "mark" },
      { id: "k-140", printCode: "140", titleEn: "Spanish", titleEs: "Español", itemType: "mark" },
      { id: "k-141", printCode: "141", titleEn: "Science", titleEs: "Ciencias", itemType: "mark" },
      { id: "k-142", printCode: "142", titleEn: "Music", titleEs: "Música", itemType: "mark" },
    ],
  },
  {
    id: "k-sec-honor",
    titleEn: "Honor code / CARE 4",
    titleEs: "Código de honor / CARE 4",
    items: [
      { id: "k-143", printCode: "143", titleEn: "Cooperation", titleEs: "Cooperación", itemType: "mark" },
      { id: "k-144", printCode: "144", titleEn: "Accountability", titleEs: "Responsabilidad", itemType: "mark" },
      { id: "k-145", printCode: "145", titleEn: "Respect", titleEs: "Respeto", itemType: "mark" },
      { id: "k-146", printCode: "146", titleEn: "Empathy", titleEs: "Empatía", itemType: "mark" },
    ],
  },
  {
    id: "k-sec-notes",
    titleEn: "ILP and comments",
    titleEs: "PIL y comentarios",
    items: [
      { id: "k-ilp-goal", printCode: "ILP_GOAL", titleEn: "ILP Goal", titleEs: "Meta del PIL", itemType: "comment", maxChars: 500 },
      { id: "k-147", printCode: "147", titleEn: "ILP term note", titleEs: "Nota del PIL", itemType: "comment", maxChars: 800 },
      { id: "k-fall", printCode: "FALL_COMMENTS", titleEn: "Fall teacher comments", titleEs: "Comentarios de otoño", itemType: "comment", maxChars: 2000 },
      { id: "k-winter", printCode: "WINTER_COMMENTS", titleEn: "Winter teacher comments", titleEs: "Comentarios de invierno", itemType: "comment", maxChars: 2000 },
      { id: "k-spring", printCode: "SPRING_COMMENTS", titleEn: "Spring teacher comments", titleEs: "Comentarios de primavera", itemType: "comment", maxChars: 2000 },
    ],
  },
];

export function kindergartenScale(): { scale: GradeScale; marks: GradeScaleMark[] } {
  return {
    scale: { id: IDS.scale431, name: "4 / 3 / 2 / 1 / NYA" },
    marks: [
      { id: IDS.mark4, scaleId: IDS.scale431, code: "4", labelEn: "Above", labelEs: "Sobresaliente", sortOrder: 1, isPassing: true },
      { id: IDS.mark3, scaleId: IDS.scale431, code: "3", labelEn: "Meets", labelEs: "Cumple", sortOrder: 2, isPassing: true },
      { id: IDS.mark2, scaleId: IDS.scale431, code: "2", labelEn: "Approaching", labelEs: "En progreso", sortOrder: 3, isPassing: true },
      { id: IDS.mark1, scaleId: IDS.scale431, code: "1", labelEn: "Below", labelEs: "Por debajo", sortOrder: 4, isPassing: false },
      { id: IDS.markNya, scaleId: IDS.scale431, code: "NYA", labelEn: "Not yet assessed", labelEs: "Aún no evaluado", sortOrder: 5, isPassing: true },
    ],
  };
}

export function kindergartenCatalog(): {
  scale: GradeScale;
  marks: GradeScaleMark[];
  template: StoreState["templates"][number];
  templateGradeLevels: TemplateGradeLevel[];
  sections: TemplateSection[];
  items: TemplateItem[];
} {
  const { scale, marks } = kindergartenScale();
  const html = kindergartenHtmlEn();
  return {
    scale,
    marks,
    template: {
      id: IDS.tmplKinder,
      academicYearId: IDS.year2627,
      gradeScaleId: IDS.scale431,
      name: "Kindergarten standards report",
      status: "published",
      layout: defaultLayout(),
      locale: "en",
      html,
    },
    templateGradeLevels: [{ templateId: IDS.tmplKinder, gradeLevelId: gradeLevelId("K") }],
    sections: KINDER_SECTIONS.map((s, i) => ({
      id: s.id,
      templateId: IDS.tmplKinder,
      sortOrder: i + 1,
      titleEn: s.titleEn,
      titleEs: s.titleEs,
    })),
    items: KINDER_SECTIONS.flatMap((s) =>
      s.items.map((item, i) => ({
        id: item.id,
        sectionId: s.id,
        sortOrder: i + 1,
        titleEn: item.titleEn,
        titleEs: item.titleEs,
        itemType: item.itemType,
        maxChars: item.maxChars,
        printCode: item.printCode,
      })),
    ),
  };
}

function kStudent(n: string, first: string, last: string, preferred: string, lang: "en" | "es"): Student {
  return {
    id: `77777777-7777-4777-8777-${n.padStart(12, "0")}`,
    siteId: IDS.siteMaple,
    studentNumber: `2026${n.padStart(4, "0")}`,
    firstName: first,
    lastName: last,
    preferredName: preferred,
    gradeLevelId: gradeLevelId("K"),
    homeLanguage: lang,
  };
}

export function kindergartenDemoRoster(): {
  students: Student[];
  course: Course;
  teacher: CourseTeacher;
  enrollments: Enrollment[];
  grades: Grade[];
  attendance: AttendanceRecord[];
} {
  const students = [
    kStudent("21", "Elena", "Ruiz", "Lena", "es"),
    kStudent("22", "Jonah", "Park", "Jonah", "en"),
  ];
  const enrollments: Enrollment[] = students.map((s, i) => ({
    id: `enr-k-${i + 1}`,
    courseId: IDS.courseMapleK,
    studentId: s.id,
  }));
  const course: Course = {
    id: IDS.courseMapleK,
    siteId: IDS.siteMaple,
    academicYearId: IDS.year2627,
    gradeLevelId: gradeLevelId("K"),
    templateId: IDS.tmplKinder,
    name: "Kindergarten Homeroom — Shah",
  };
  const teacher: CourseTeacher = {
    id: "ct-priya-k",
    courseId: IDS.courseMapleK,
    profileId: IDS.userPriya,
    canGrade: true,
    canPrint: true,
  };
  const grades: Grade[] = [
    { id: "gr-k-1-101", enrollmentId: "enr-k-1", termId: IDS.term1, templateItemId: "k-101", markId: IDS.mark3, comment: "" },
    { id: "gr-k-1-102", enrollmentId: "enr-k-1", termId: IDS.term1, templateItemId: "k-102", markId: IDS.mark3, comment: "" },
    { id: "gr-k-1-103", enrollmentId: "enr-k-1", termId: IDS.term1, templateItemId: "k-103", markId: IDS.mark2, comment: "" },
    { id: "gr-k-1-108", enrollmentId: "enr-k-1", termId: IDS.term1, templateItemId: "k-108", markId: IDS.mark4, comment: "" },
    { id: "gr-k-1-143", enrollmentId: "enr-k-1", termId: IDS.term1, templateItemId: "k-143", markId: IDS.mark3, comment: "" },
    {
      id: "gr-k-1-ilp",
      enrollmentId: "enr-k-1",
      termId: IDS.term1,
      templateItemId: "k-ilp-goal",
      markId: null,
      comment: "Build letter-sound fluency in small group.",
    },
    {
      id: "gr-k-1-147",
      enrollmentId: "enr-k-1",
      termId: IDS.term1,
      templateItemId: "k-147",
      markId: null,
      comment: "Practicing uppercase letters daily.",
    },
    {
      id: "gr-k-1-fall",
      enrollmentId: "enr-k-1",
      termId: IDS.term1,
      templateItemId: "k-fall",
      markId: null,
      comment: "Lena is a joyful classmate and is growing as a reader.",
    },
  ];
  const attendance: AttendanceRecord[] = [
    { id: "att-k-1-t1", enrollmentId: "enr-k-1", termId: IDS.term1, absences: 2, tardies: 1 },
  ];
  return { students, course, teacher, enrollments, grades, attendance };
}

/** Add the Kindergarten catalog to an existing demo store if it is missing. */
export function ensureKindergarten(state: StoreState) {
  if (!state.attendance) state.attendance = [];
  for (const template of state.templates) {
    const legacy = template as typeof template & { htmlEn?: string; htmlEs?: string };
    if (template.html == null) template.html = legacy.htmlEn ?? "";
    if (!template.locale) template.locale = "en";
  }
  if (state.templates.some((t) => t.id === IDS.tmplKinder)) return;

  const catalog = kindergartenCatalog();
  const roster = kindergartenDemoRoster();
  if (!state.scales.some((s) => s.id === catalog.scale.id)) {
    state.scales.push(catalog.scale);
    state.marks.push(...catalog.marks);
  }
  state.templates.push(catalog.template);
  state.templateGradeLevels = state.templateGradeLevels.filter(
    (x) => !(x.templateId === IDS.tmplElem && x.gradeLevelId === gradeLevelId("K")),
  );
  state.templateGradeLevels.push(...catalog.templateGradeLevels);
  state.sections.push(...catalog.sections);
  state.items.push(...catalog.items);
  for (const student of roster.students) {
    if (!state.students.some((s) => s.id === student.id)) state.students.push(student);
  }
  if (!state.courses.some((c) => c.id === roster.course.id)) {
    state.courses.push(roster.course);
    state.courseTeachers.push(roster.teacher);
    state.enrollments.push(...roster.enrollments);
    state.grades.push(...roster.grades);
    state.attendance.push(...roster.attendance);
  }
}
