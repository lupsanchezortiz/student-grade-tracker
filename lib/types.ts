export type TermStructure = "semester" | "trimester" | "quarter";
export type TemplateStatus = "draft" | "published";
export type ItemType = "mark" | "comment";
export type SiteRole = "site_admin" | "teacher";
export type Locale = "en" | "es";

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
  academicYearId: string;
  gradeScaleId: string;
  name: string;
  status: TemplateStatus;
  layout: TemplateLayout;
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
};

export type TemplateItem = {
  id: string;
  sectionId: string;
  sortOrder: number;
  titleEn: string;
  titleEs: string;
  itemType: ItemType;
  /** Character limit for comment items. Ignored for marks. */
  maxChars?: number;
};

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
  table: {
    showMarkCode: boolean;
    showMarkLabel: boolean;
    density: "compact" | "spacious";
    markColumnWidth: "narrow" | "wide";
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
};

export type TemplateDetail = ReportCardTemplate & {
  year: AcademicYear;
  scale: GradeScale;
  marks: GradeScaleMark[];
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
  students: Student[];
  grades: Grade[];
};
