export type TermStructure = "semester" | "trimester" | "quarter";
export type TemplateStatus = "draft" | "published";
export type ItemType = "mark" | "comment";
export type SiteRole = "site_admin" | "teacher";
export type Locale = "en" | "es";
export type SectionGradedBy = "homeroom" | "specialist";

export type Site = {
  id: string;
  name: string;
  code: string;
  address: string;
  createdAt: string;
};

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  isSystemAdmin: boolean;
  /** Demo-mode only. Never stored in Supabase. */
  password?: string;
};

export type SiteMembership = {
  id: string;
  profileId: string;
  siteId: string;
  role: SiteRole;
};

export type AcademicYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  termStructure: TermStructure;
};

export type Term = {
  id: string;
  academicYearId: string;
  sortOrder: number;
  nameEn: string;
  nameEs: string;
  startDate: string;
  endDate: string;
};

export type GradeLevel = {
  id: string;
  code: string;
  nameEn: string;
  nameEs: string;
  sortOrder: number;
};

export type GradeScale = {
  id: string;
  name: string;
};

export type GradeScaleMark = {
  id: string;
  scaleId: string;
  code: string;
  labelEn: string;
  labelEs: string;
  sortOrder: number;
  isPassing: boolean;
};

export type ReportCardTemplate = {
  id: string;
  /** Grading periods this HTML is built for. Must match the course’s school year. */
  termStructure: TermStructure;
  name: string;
  status: TemplateStatus;
  layout: TemplateLayout;
  /** One language per template. Add another language by cloning. */
  locale: Locale;
  /** PowerSchool-style HTML for this language. Empty uses the built-in PDF. */
  html: string;
  /** When this card was cloned from another language. */
  sourceTemplateId?: string;
  /** @deprecated Year comes from the course. Kept for older demo stores. */
  academicYearId?: string;
  /** @deprecated Scale lives on each line item. Kept as a migrate fallback. */
  gradeScaleId?: string;
};

export type TemplateGradeLevel = {
  templateId: string;
  gradeLevelId: string;
};

export type TemplateSection = {
  id: string;
  templateId: string;
  sortOrder: number;
  titleEn: string;
  titleEs: string;
  /** Who enters marks in this section. Homeroom can always view specialist columns. */
  gradedBy?: SectionGradedBy;
};

export type TemplateItem = {
  id: string;
  sectionId: string;
  sortOrder: number;
  titleEn: string;
  titleEs: string;
  itemType: ItemType;
  /** Scale for mark items. Ignored for comments. */
  gradeScaleId?: string;
  /** Character limit for comment items. Ignored for marks. */
  maxChars?: number;
  /** Line number (`01`) or named code. HTML expands `01` to {{101}} / {{201}} / {{301}} (and {{401}} for quarters). */
  printCode?: string;
};

export type TypeSize = "sm" | "md" | "lg";

export type TemplateLayout = {
  headerFields: {
    student: boolean;
    id: boolean;
    grade: boolean;
    school: boolean;
    term: boolean;
    year: boolean;
    course: boolean;
  };
  commentsPlacement: "inline" | "bottom";
  copy: {
    titleEn: string;
    titleEs: string;
    footerEn: string;
    footerEs: string;
  };
  type: {
    titleSize: TypeSize;
    bodySize: TypeSize;
  };
  colors: {
    page: string;
    ink: string;
    band: string;
    border: string;
    accent: string;
  };
  table: {
    showMarkCode: boolean;
    showMarkLabel: boolean;
    density: "compact" | "spacious";
    /** @deprecated Prefer criterionWidth. Kept for older saved layouts. */
    markColumnWidth: "narrow" | "wide";
    /** Criterion column percent (50–85). Mark column is the remainder. */
    criterionWidth: number;
    showOuterBorder: boolean;
  };
};

export type Student = {
  id: string;
  siteId: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  preferredName: string;
  gradeLevelId: string;
  homeLanguage: Locale;
};

export type Course = {
  id: string;
  siteId: string;
  academicYearId: string;
  gradeLevelId: string;
  templateId: string;
  name: string;
};

export type CourseTeacher = {
  id: string;
  courseId: string;
  profileId: string;
  canGrade: boolean;
  canPrint: boolean;
  /** Enter homeroom sections. Defaults to true when no specialist sections are assigned. */
  gradesHomeroom?: boolean;
  /** Specialist (or other) section ids this teacher may enter. */
  sectionIds?: string[];
};

export type Enrollment = {
  id: string;
  courseId: string;
  studentId: string;
};

export type Grade = {
  id: string;
  enrollmentId: string;
  termId: string;
  templateItemId: string;
  markId: string | null;
  comment: string;
};

export type AttendanceRecord = {
  id: string;
  enrollmentId: string;
  termId: string;
  absences: number;
  tardies: number;
};

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  isSystemAdmin: boolean;
  memberships: { siteId: string; role: SiteRole }[];
};

export type StoreState = {
  sites: Site[];
  profiles: Profile[];
  memberships: SiteMembership[];
  years: AcademicYear[];
  terms: Term[];
  gradeLevels: GradeLevel[];
  scales: GradeScale[];
  marks: GradeScaleMark[];
  templates: ReportCardTemplate[];
  templateGradeLevels: TemplateGradeLevel[];
  sections: TemplateSection[];
  items: TemplateItem[];
  students: Student[];
  courses: Course[];
  courseTeachers: CourseTeacher[];
  enrollments: Enrollment[];
  grades: Grade[];
  attendance: AttendanceRecord[];
};

export type TemplateDetail = ReportCardTemplate & {
  scale: GradeScale;
  marks: GradeScaleMark[];
  marksByScaleId: Record<string, GradeScaleMark[]>;
  gradeLevelIds: string[];
  sections: (TemplateSection & { items: TemplateItem[] })[];
};

export type CourseDetail = Course & {
  site: Site;
  year: AcademicYear;
  gradeLevel: GradeLevel;
  template: TemplateDetail;
  teachers: (CourseTeacher & { profile: Profile })[];
  enrollments: (Enrollment & { student: Student })[];
};

export type GradebookPayload = {
  course: CourseDetail;
  term: Term;
  terms: Term[];
  canEdit: boolean;
  canPrint: boolean;
  /** Line items the signed-in teacher may change. Others stay visible. */
  editableItemIds: string[];
  /** Site administrators load absences and tardies from CSV. */
  canImportAttendance: boolean;
  students: Student[];
  grades: Grade[];
  attendance: AttendanceRecord[];
};
