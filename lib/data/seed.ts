import { gradeLevelId, IDS } from "@/lib/ids";
import type {
  AcademicYear,
  Course,
  CourseTeacher,
  Enrollment,
  Grade,
  GradeLevel,
  GradeScale,
  GradeScaleMark,
  Profile,
  ReportCardTemplate,
  Site,
  SiteMembership,
  StoreState,
  Student,
  TemplateGradeLevel,
  TemplateItem,
  TemplateSection,
  Term,
} from "@/lib/types";

const gl = (
  code: string,
  nameEn: string,
  nameEs: string,
  sortOrder: number,
): GradeLevel => ({
  id: gradeLevelId(code),
  code,
  nameEn,
  nameEs,
  sortOrder,
});

export const GRADE_LEVELS: GradeLevel[] = [
  gl("K", "Kindergarten", "Kinder", 0),
  gl("1", "Grade 1", "1.° grado", 1),
  gl("2", "Grade 2", "2.° grado", 2),
  gl("3", "Grade 3", "3.° grado", 3),
  gl("4", "Grade 4", "4.° grado", 4),
  gl("5", "Grade 5", "5.° grado", 5),
  gl("6", "Grade 6", "6.° grado", 6),
  gl("7", "Grade 7", "7.° grado", 7),
  gl("8", "Grade 8", "8.° grado", 8),
  gl("9", "Grade 9", "9.° grado", 9),
  gl("10", "Grade 10", "10.° grado", 10),
  gl("11", "Grade 11", "11.° grado", 11),
  gl("12", "Grade 12", "12.° grado", 12),
];

const SITES: Site[] = [
  {
    id: IDS.siteMaple,
    name: "Maple Elementary",
    code: "MPL",
    address: "1400 Maple Avenue, Northside",
    createdAt: "2026-07-01T12:00:00.000Z",
  },
  {
    id: IDS.siteCedar,
    name: "Cedar Ridge K–8",
    code: "CDR",
    address: "88 Ridge Road, Northside",
    createdAt: "2026-07-01T12:00:00.000Z",
  },
];

const PROFILES: Profile[] = [
  {
    id: IDS.userElena,
    email: "elena.voss@northside.edu",
    fullName: "Elena Voss",
    isSystemAdmin: true,
    password: "demo",
  },
  {
    id: IDS.userMarco,
    email: "marco.santos@maple.northside.edu",
    fullName: "Marco Santos",
    isSystemAdmin: false,
    password: "demo",
  },
  {
    id: IDS.userPriya,
    email: "priya.shah@maple.northside.edu",
    fullName: "Priya Shah",
    isSystemAdmin: false,
    password: "demo",
  },
  {
    id: IDS.userLena,
    email: "lena.cho@cedar.northside.edu",
    fullName: "Lena Cho",
    isSystemAdmin: false,
    password: "demo",
  },
];

const MEMBERSHIPS: SiteMembership[] = [
  {
    id: "mem-marco",
    profileId: IDS.userMarco,
    siteId: IDS.siteMaple,
    role: "site_admin",
  },
  {
    id: "mem-priya",
    profileId: IDS.userPriya,
    siteId: IDS.siteMaple,
    role: "teacher",
  },
  {
    id: "mem-lena",
    profileId: IDS.userLena,
    siteId: IDS.siteCedar,
    role: "site_admin",
  },
];

const YEARS: AcademicYear[] = [
  {
    id: IDS.year2627,
    name: "2026–27",
    startDate: "2026-08-17",
    endDate: "2027-06-11",
    termStructure: "trimester",
  },
];

const TERMS: Term[] = [
  {
    id: IDS.term1,
    academicYearId: IDS.year2627,
    sortOrder: 1,
    nameEn: "Trimester 1",
    nameEs: "Trimestre 1",
    startDate: "2026-08-17",
    endDate: "2026-11-13",
  },
  {
    id: IDS.term2,
    academicYearId: IDS.year2627,
    sortOrder: 2,
    nameEn: "Trimester 2",
    nameEs: "Trimestre 2",
    startDate: "2026-11-16",
    endDate: "2027-03-05",
  },
  {
    id: IDS.term3,
    academicYearId: IDS.year2627,
    sortOrder: 3,
    nameEn: "Trimester 3",
    nameEs: "Trimestre 3",
    startDate: "2027-03-08",
    endDate: "2027-06-11",
  },
];

const SCALES: GradeScale[] = [{ id: IDS.scaleEsnu, name: "E / S / N / U" }];

const MARKS: GradeScaleMark[] = [
  {
    id: IDS.markE,
    scaleId: IDS.scaleEsnu,
    code: "E",
    labelEn: "Exceeds",
    labelEs: "Sobresaliente",
    sortOrder: 1,
    isPassing: true,
  },
  {
    id: IDS.markS,
    scaleId: IDS.scaleEsnu,
    code: "S",
    labelEn: "Satisfactory",
    labelEs: "Satisfactorio",
    sortOrder: 2,
    isPassing: true,
  },
  {
    id: IDS.markN,
    scaleId: IDS.scaleEsnu,
    code: "N",
    labelEn: "Needs improvement",
    labelEs: "Necesita mejorar",
    sortOrder: 3,
    isPassing: true,
  },
  {
    id: IDS.markU,
    scaleId: IDS.scaleEsnu,
    code: "U",
    labelEn: "Unsatisfactory",
    labelEs: "Insatisfactorio",
    sortOrder: 4,
    isPassing: false,
  },
];

const TEMPLATES: ReportCardTemplate[] = [
  {
    id: IDS.tmplElem,
    academicYearId: IDS.year2627,
    gradeScaleId: IDS.scaleEsnu,
    name: "Elementary progress report",
    status: "published",
  },
];

const TEMPLATE_GRADE_LEVELS: TemplateGradeLevel[] = ["K", "1", "2", "3", "4", "5"].map(
  (code) => ({
    templateId: IDS.tmplElem,
    gradeLevelId: gradeLevelId(code),
  }),
);

type SectionSeed = {
  id: string;
  titleEn: string;
  titleEs: string;
  items: { id: string; titleEn: string; titleEs: string; itemType: "mark" | "comment" }[];
};

const SECTION_SEEDS: SectionSeed[] = [
  {
    id: "sec-ela",
    titleEn: "Language arts",
    titleEs: "Artes del lenguaje",
    items: [
      {
        id: "it-read",
        titleEn: "Reading",
        titleEs: "Lectura",
        itemType: "mark",
      },
      {
        id: "it-write",
        titleEn: "Writing",
        titleEs: "Escritura",
        itemType: "mark",
      },
      {
        id: "it-speak",
        titleEn: "Speaking and listening",
        titleEs: "Hablar y escuchar",
        itemType: "mark",
      },
    ],
  },
  {
    id: "sec-math",
    titleEn: "Mathematics",
    titleEs: "Matemáticas",
    items: [
      {
        id: "it-num",
        titleEn: "Number sense",
        titleEs: "Sentido numérico",
        itemType: "mark",
      },
      {
        id: "it-ops",
        titleEn: "Operations",
        titleEs: "Operaciones",
        itemType: "mark",
      },
      {
        id: "it-meas",
        titleEn: "Measurement and data",
        titleEs: "Medición y datos",
        itemType: "mark",
      },
    ],
  },
  {
    id: "sec-sci",
    titleEn: "Science",
    titleEs: "Ciencias",
    items: [
      {
        id: "it-sci",
        titleEn: "Scientific thinking",
        titleEs: "Pensamiento científico",
        itemType: "mark",
      },
    ],
  },
  {
    id: "sec-ss",
    titleEn: "Social studies",
    titleEs: "Estudios sociales",
    items: [
      {
        id: "it-ss",
        titleEn: "Community and history",
        titleEs: "Comunidad e historia",
        itemType: "mark",
      },
    ],
  },
  {
    id: "sec-habits",
    titleEn: "Work habits",
    titleEs: "Hábitos de trabajo",
    items: [
      {
        id: "it-ontime",
        titleEn: "Completes work on time",
        titleEs: "Completa el trabajo a tiempo",
        itemType: "mark",
      },
      {
        id: "it-coop",
        titleEn: "Works cooperatively",
        titleEs: "Trabaja en cooperación",
        itemType: "mark",
      },
      {
        id: "it-dir",
        titleEn: "Follows directions",
        titleEs: "Sigue instrucciones",
        itemType: "mark",
      },
    ],
  },
  {
    id: "sec-notes",
    titleEn: "Teacher comments",
    titleEs: "Comentarios del maestro",
    items: [
      {
        id: "it-comment",
        titleEn: "Comments",
        titleEs: "Comentarios",
        itemType: "comment",
      },
    ],
  },
];

const SECTIONS: TemplateSection[] = SECTION_SEEDS.map((s, i) => ({
  id: s.id,
  templateId: IDS.tmplElem,
  sortOrder: i + 1,
  titleEn: s.titleEn,
  titleEs: s.titleEs,
}));

const ITEMS: TemplateItem[] = SECTION_SEEDS.flatMap((s) =>
  s.items.map((item, i) => ({
    id: item.id,
    sectionId: s.id,
    sortOrder: i + 1,
    titleEn: item.titleEn,
    titleEs: item.titleEs,
    itemType: item.itemType,
  })),
);

function student(
  n: string,
  siteId: string,
  first: string,
  last: string,
  preferred: string,
  grade: string,
  homeLanguage: "en" | "es",
): Student {
  return {
    id: `77777777-7777-4777-8777-${n.padStart(12, "0")}`,
    siteId,
    studentNumber: `2026${n.padStart(4, "0")}`,
    firstName: first,
    lastName: last,
    preferredName: preferred,
    gradeLevelId: gradeLevelId(grade),
    homeLanguage,
  };
}

const STUDENTS: Student[] = [
  student("1", IDS.siteMaple, "Sofia", "Alvarez", "Sofia", "3", "es"),
  student("2", IDS.siteMaple, "Mateo", "Chen", "Mateo", "3", "en"),
  student("3", IDS.siteMaple, "Amara", "Diallo", "Amara", "3", "en"),
  student("4", IDS.siteMaple, "Noah", "Patel", "Noah", "3", "en"),
  student("5", IDS.siteMaple, "Lucia", "Romero", "Lucia", "3", "es"),
  student("6", IDS.siteMaple, "Ethan", "Brooks", "Ethan", "3", "en"),
  student("7", IDS.siteMaple, "Jade", "Nguyen", "Jade", "2", "en"),
  student("8", IDS.siteCedar, "Omar", "Hassan", "Omar", "5", "en"),
  student("9", IDS.siteCedar, "Isabel", "Cruz", "Isa", "5", "es"),
];

const COURSES: Course[] = [
  {
    id: IDS.courseMapleG3,
    siteId: IDS.siteMaple,
    academicYearId: IDS.year2627,
    gradeLevelId: gradeLevelId("3"),
    templateId: IDS.tmplElem,
    name: "Grade 3 Homeroom — Shah",
  },
  {
    id: IDS.courseCedarG5,
    siteId: IDS.siteCedar,
    academicYearId: IDS.year2627,
    gradeLevelId: gradeLevelId("5"),
    templateId: IDS.tmplElem,
    name: "Grade 5 Homeroom",
  },
];

const COURSE_TEACHERS: CourseTeacher[] = [
  {
    id: "ct-priya",
    courseId: IDS.courseMapleG3,
    profileId: IDS.userPriya,
    canGrade: true,
    canPrint: true,
  },
];

const mapleG3 = STUDENTS.filter(
  (s) => s.siteId === IDS.siteMaple && s.gradeLevelId === gradeLevelId("3"),
);

const ENROLLMENTS: Enrollment[] = mapleG3.map((s, i) => ({
  id: `enr-${i + 1}`,
  courseId: IDS.courseMapleG3,
  studentId: s.id,
}));

function g(
  enrollmentId: string,
  itemId: string,
  markId: string,
  comment = "",
): Grade {
  return {
    id: `gr-${enrollmentId}-${itemId}`,
    enrollmentId,
    termId: IDS.term1,
    templateItemId: itemId,
    markId,
    comment,
  };
}

const GRADES: Grade[] = [
  g("enr-1", "it-read", IDS.markS),
  g("enr-1", "it-write", IDS.markE),
  g("enr-1", "it-speak", IDS.markS),
  g("enr-1", "it-num", IDS.markS),
  g("enr-1", "it-ops", IDS.markS),
  g("enr-1", "it-meas", IDS.markN),
  g("enr-1", "it-sci", IDS.markS),
  g("enr-1", "it-ss", IDS.markE),
  g("enr-1", "it-ontime", IDS.markS),
  g("enr-1", "it-coop", IDS.markE),
  g("enr-1", "it-dir", IDS.markS),
  g(
    "enr-1",
    "it-comment",
    "",
    "Sofia writes with voice and care. Measurement is the next focus.",
  ),
  g("enr-2", "it-read", IDS.markE),
  g("enr-2", "it-write", IDS.markS),
  g("enr-2", "it-num", IDS.markE),
  g("enr-2", "it-ops", IDS.markE),
  g(
    "enr-2",
    "it-comment",
    "",
    "Mateo is a strong mathematician and a generous classmate.",
  ),
  g("enr-3", "it-read", IDS.markN),
  g("enr-3", "it-write", IDS.markS),
  g("enr-3", "it-num", IDS.markS),
  g(
    "enr-3",
    "it-comment",
    "",
    "Amara is building reading stamina. Small-group work is helping.",
  ),
].map((row) => ({
  ...row,
  markId: row.markId || null,
}));

export function createSeedState(): StoreState {
  return {
    sites: structuredClone(SITES),
    profiles: structuredClone(PROFILES),
    memberships: structuredClone(MEMBERSHIPS),
    years: structuredClone(YEARS),
    terms: structuredClone(TERMS),
    gradeLevels: structuredClone(GRADE_LEVELS),
    scales: structuredClone(SCALES),
    marks: structuredClone(MARKS),
    templates: structuredClone(TEMPLATES),
    templateGradeLevels: structuredClone(TEMPLATE_GRADE_LEVELS),
    sections: structuredClone(SECTIONS),
    items: structuredClone(ITEMS),
    students: structuredClone(STUDENTS),
    courses: structuredClone(COURSES),
    courseTeachers: structuredClone(COURSE_TEACHERS),
    enrollments: structuredClone(ENROLLMENTS),
    grades: structuredClone(GRADES),
  };
}

export const DEMO_ACCOUNTS = [
  {
    email: "elena.voss@northside.edu",
    name: "Elena Voss",
    role: "System admin · district office",
  },
  {
    email: "marco.santos@maple.northside.edu",
    name: "Marco Santos",
    role: "Site admin · Maple Elementary",
  },
  {
    email: "priya.shah@maple.northside.edu",
    name: "Priya Shah",
    role: "Teacher · Grade 3, Maple",
  },
  {
    email: "lena.cho@cedar.northside.edu",
    name: "Lena Cho",
    role: "Site admin · Cedar Ridge K–8",
  },
] as const;
