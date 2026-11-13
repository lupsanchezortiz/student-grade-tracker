#!/usr/bin/env node
/**
 * Demo Academy Seed Script
 * 
 * Creates or resets a complete demo school "Demo Academy" in the live Supabase database.
 * All data is scoped to the demo site and can be safely deleted without affecting other schools.
 * 
 * Usage:
 *   npm run demo:seed   # Create or recreate demo school
 *   npm run demo:reset  # Delete and recreate demo school
 * 
 * Required environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL       - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY      - Service role key (admin access)
 *   DEMO_ADMIN_PASSWORD            - Password for demo@studentreportcards.com
 *   DEMO_TEACHER_PASSWORD          - (Optional) Password for teacher@demo.academy
 */

import { createClient } from "@supabase/supabase-js";

const DEMO_SITE_CODE = "DEMO";
const DEMO_SITE_NAME = "Demo Academy";

// Check required environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD;
const DEMO_TEACHER_PASSWORD = process.env.DEMO_TEACHER_PASSWORD;

if (!SUPABASE_URL) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  process.exit(1);
}

if (!SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  process.exit(1);
}

if (!DEMO_ADMIN_PASSWORD) {
  console.error("❌ Missing DEMO_ADMIN_PASSWORD environment variable");
  console.error("   This password is required for the demo@studentreportcards.com account");
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type GradeLevel = {
  id: string;
  code: string;
  nameEn: string;
  nameEs: string;
  sortOrder: number;
};

type AcademicYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

type GradeScale = {
  id: string;
  name: string;
};

type GradeScaleMark = {
  id: string;
  scaleId: string;
  code: string;
  labelEn: string;
  labelEs: string;
  sortOrder: number;
  isPassing: boolean;
};

type ReportCardTemplate = {
  id: string;
  academicYearId: string;
  gradeScaleId: string;
  name: string;
  status: "draft" | "published";
  termStructure: "semester" | "trimester" | "quarter";
  layout: any;
  locale: "en" | "es";
  html: string;
};

async function reset() {
  console.log("\n🗑️  Resetting Demo Academy...");
  
  // Find demo site
  const { data: sites } = await supabase
    .from("sites")
    .select("id")
    .eq("code", DEMO_SITE_CODE);
  
  if (!sites || sites.length === 0) {
    console.log("ℹ️  No existing Demo Academy found");
    return null;
  }
  
  const siteId = sites[0].id;
  console.log(`   Found demo site: ${siteId}`);
  
  // Delete courses (cascades to enrollments, grades, course_teachers)
  const { error: coursesError } = await supabase
    .from("courses")
    .delete()
    .eq("site_id", siteId);
  
  if (coursesError) {
    console.error("   Error deleting courses:", coursesError.message);
  } else {
    console.log("   ✓ Deleted courses and related data");
  }
  
  // Delete students
  const { error: studentsError } = await supabase
    .from("students")
    .delete()
    .eq("site_id", siteId);
  
  if (studentsError) {
    console.error("   Error deleting students:", studentsError.message);
  } else {
    console.log("   ✓ Deleted students");
  }
  
  // Delete site memberships
  const { error: membershipsError } = await supabase
    .from("site_memberships")
    .delete()
    .eq("site_id", siteId);
  
  if (membershipsError) {
    console.error("   Error deleting memberships:", membershipsError.message);
  } else {
    console.log("   ✓ Deleted site memberships");
  }
  
  // Delete demo auth users
  const demoEmails = [
    "demo@studentreportcards.com",
    "teacher@demo.academy",
  ];
  
  for (const email of demoEmails) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const demoUser = users.users.find(u => u.email?.toLowerCase() === email);
    
    if (demoUser) {
      await supabase.auth.admin.deleteUser(demoUser.id);
      console.log(`   ✓ Deleted auth user: ${email}`);
    }
  }
  
  // Delete site
  const { error: siteError } = await supabase
    .from("sites")
    .delete()
    .eq("id", siteId);
  
  if (siteError) {
    console.error("   Error deleting site:", siteError.message);
  } else {
    console.log("   ✓ Deleted demo site");
  }
  
  return siteId;
}

async function seed() {
  console.log("\n🌱 Seeding Demo Academy...");
  
  // Get or create grade levels (district catalog)
  const { data: existingLevels } = await supabase
    .from("grade_levels")
    .select("*")
    .order("sort_order");
  
  let gradeLevels: GradeLevel[] = [];
  
  if (!existingLevels || existingLevels.length === 0) {
    console.log("   Creating grade levels...");
    const levels = [
      { code: "K", nameEn: "Kindergarten", nameEs: "Kinder", sortOrder: 0 },
      { code: "1", nameEn: "Grade 1", nameEs: "1.° grado", sortOrder: 1 },
      { code: "2", nameEn: "Grade 2", nameEs: "2.° grado", sortOrder: 2 },
      { code: "3", nameEn: "Grade 3", nameEs: "3.° grado", sortOrder: 3 },
      { code: "4", nameEn: "Grade 4", nameEs: "4.° grado", sortOrder: 4 },
      { code: "5", nameEn: "Grade 5", nameEs: "5.° grado", sortOrder: 5 },
      { code: "6", nameEn: "Grade 6", nameEs: "6.° grado", sortOrder: 6 },
      { code: "7", nameEn: "Grade 7", nameEs: "7.° grado", sortOrder: 7 },
      { code: "8", nameEn: "Grade 8", nameEs: "8.° grado", sortOrder: 8 },
    ];
    
    const { data: createdLevels } = await supabase
      .from("grade_levels")
      .insert(levels.map(l => ({
        code: l.code,
        name_en: l.nameEn,
        name_es: l.nameEs,
        sort_order: l.sortOrder,
      })))
      .select();
    
    gradeLevels = createdLevels!.map(l => ({
      id: l.id,
      code: l.code,
      nameEn: l.name_en,
      nameEs: l.name_es,
      sortOrder: l.sort_order,
    }));
    
    console.log(`   ✓ Created ${gradeLevels.length} grade levels`);
  } else {
    gradeLevels = existingLevels.map(l => ({
      id: l.id,
      code: l.code,
      nameEn: l.name_en,
      nameEs: l.name_es,
      sortOrder: l.sort_order,
    }));
    console.log(`   ✓ Found ${gradeLevels.length} existing grade levels`);
  }
  
  // Get or create academic year
  const { data: existingYears } = await supabase
    .from("academic_years")
    .select("*")
    .eq("name", "2026–27");
  
  let academicYear: AcademicYear;
  
  if (!existingYears || existingYears.length === 0) {
    console.log("   Creating academic year 2026–27...");
    const { data: createdYear } = await supabase
      .from("academic_years")
      .insert({
        name: "2026–27",
        start_date: "2026-08-17",
        end_date: "2027-06-11",
        term_structure: "trimester",
      })
      .select()
      .single();
    
    academicYear = {
      id: createdYear!.id,
      name: createdYear!.name,
      startDate: createdYear!.start_date,
      endDate: createdYear!.end_date,
    };
    
    console.log("   ✓ Created academic year");
  } else {
    academicYear = {
      id: existingYears[0].id,
      name: existingYears[0].name,
      startDate: existingYears[0].start_date,
      endDate: existingYears[0].end_date,
    };
    console.log("   ✓ Found existing academic year");
  }
  
  // Get or create grade scale
  const { data: existingScales } = await supabase
    .from("grade_scales")
    .select("*")
    .eq("name", "E / S / N / U");
  
  let gradeScale: GradeScale;
  let marks: GradeScaleMark[] = [];
  
  if (!existingScales || existingScales.length === 0) {
    console.log("   Creating grade scale...");
    const { data: createdScale } = await supabase
      .from("grade_scales")
      .insert({ name: "E / S / N / U" })
      .select()
      .single();
    
    gradeScale = { id: createdScale!.id, name: createdScale!.name };
    
    const markData = [
      { code: "E", labelEn: "Exceeds", labelEs: "Sobresaliente", sortOrder: 1, isPassing: true },
      { code: "S", labelEn: "Satisfactory", labelEs: "Satisfactorio", sortOrder: 2, isPassing: true },
      { code: "N", labelEn: "Needs improvement", labelEs: "Necesita mejorar", sortOrder: 3, isPassing: true },
      { code: "U", labelEn: "Unsatisfactory", labelEs: "Insatisfactorio", sortOrder: 4, isPassing: false },
    ];
    
    const { data: createdMarks } = await supabase
      .from("grade_scale_marks")
      .insert(markData.map(m => ({
        scale_id: gradeScale.id,
        code: m.code,
        label_en: m.labelEn,
        label_es: m.labelEs,
        sort_order: m.sortOrder,
        is_passing: m.isPassing,
      })))
      .select();
    
    marks = createdMarks!.map(m => ({
      id: m.id,
      scaleId: m.scale_id,
      code: m.code,
      labelEn: m.label_en,
      labelEs: m.label_es,
      sortOrder: m.sort_order,
      isPassing: m.is_passing,
    }));
    
    console.log("   ✓ Created grade scale with 4 marks");
  } else {
    gradeScale = { id: existingScales[0].id, name: existingScales[0].name };
    
    const { data: existingMarks } = await supabase
      .from("grade_scale_marks")
      .select("*")
      .eq("scale_id", gradeScale.id)
      .order("sort_order");
    
    marks = existingMarks!.map(m => ({
      id: m.id,
      scaleId: m.scale_id,
      code: m.code,
      labelEn: m.label_en,
      labelEs: m.label_es,
      sortOrder: m.sort_order,
      isPassing: m.is_passing,
    }));
    
    console.log("   ✓ Found existing grade scale");
  }
  
  // Create Demo Academy site
  console.log(`   Creating ${DEMO_SITE_NAME}...`);
  const { data: site } = await supabase
    .from("sites")
    .insert({
      name: DEMO_SITE_NAME,
      code: DEMO_SITE_CODE,
      address: "1234 Education Lane, Demo City, DC 12345",
    })
    .select()
    .single();
  
  const siteId = site!.id;
  console.log(`   ✓ Created site: ${siteId}`);
  
  // Create terms for demo site
  console.log("   Creating terms...");
  const termData = [
    {
      academicYearId: academicYear.id,
      siteId,
      sortOrder: 1,
      nameEn: "Trimester 1",
      nameEs: "Trimestre 1",
      startDate: "2026-08-17",
      endDate: "2026-11-13",
    },
    {
      academicYearId: academicYear.id,
      siteId,
      sortOrder: 2,
      nameEn: "Trimester 2",
      nameEs: "Trimestre 2",
      startDate: "2026-11-16",
      endDate: "2027-03-05",
    },
    {
      academicYearId: academicYear.id,
      siteId,
      sortOrder: 3,
      nameEn: "Trimester 3",
      nameEs: "Trimestre 3",
      startDate: "2027-03-08",
      endDate: "2027-06-11",
    },
  ];
  
  const { data: terms } = await supabase
    .from("terms")
    .insert(termData.map(t => ({
      academic_year_id: t.academicYearId,
      site_id: t.siteId,
      sort_order: t.sortOrder,
      name_en: t.nameEn,
      name_es: t.nameEs,
      start_date: t.startDate,
      end_date: t.endDate,
    })))
    .select();
  
  console.log(`   ✓ Created ${terms!.length} terms`);
  
  // Create report card template
  console.log("   Creating report card template...");
  const { data: template } = await supabase
    .from("report_card_templates")
    .insert({
      academic_year_id: academicYear.id,
      grade_scale_id: gradeScale.id,
      name: "Demo Elementary Progress Report",
      status: "published",
      term_structure: "trimester",
      locale: "en",
      html: "",
      layout: {
        headerFields: {
          student: true,
          id: true,
          grade: true,
          school: true,
          term: true,
          year: true,
          course: true,
        },
        commentsPlacement: "inline",
        copy: {
          titleEn: "Progress Report",
          titleEs: "Reporte de Progreso",
          footerEn: "",
          footerEs: "",
        },
        type: {
          titleSize: "md",
          bodySize: "md",
        },
        colors: {
          page: "#ffffff",
          ink: "#000000",
          band: "#f0f0f0",
          border: "#cccccc",
          accent: "#2563eb",
        },
        table: {
          showMarkCode: true,
          showMarkLabel: true,
          density: "compact",
          markColumnWidth: "narrow",
          criterionWidth: 65,
          showOuterBorder: true,
        },
      },
    })
    .select()
    .single();
  
  const templateId = template!.id;
  console.log(`   ✓ Created template: ${templateId}`);
  
  // Link template to grade levels 1-5
  const templateGradeLevels = gradeLevels
    .filter(gl => ["1", "2", "3", "4", "5"].includes(gl.code))
    .map(gl => ({
      template_id: templateId,
      grade_level_id: gl.id,
    }));
  
  await supabase.from("template_grade_levels").insert(templateGradeLevels);
  console.log(`   ✓ Linked template to grades 1-5`);
  
  // Create template sections and items
  console.log("   Creating template sections and items...");
  const sections = [
    {
      titleEn: "Language Arts",
      titleEs: "Artes del Lenguaje",
      items: [
        { titleEn: "Reading comprehension", titleEs: "Comprensión de lectura", type: "mark" },
        { titleEn: "Writing skills", titleEs: "Habilidades de escritura", type: "mark" },
        { titleEn: "Speaking and listening", titleEs: "Hablar y escuchar", type: "mark" },
      ],
    },
    {
      titleEn: "Mathematics",
      titleEs: "Matemáticas",
      items: [
        { titleEn: "Number operations", titleEs: "Operaciones numéricas", type: "mark" },
        { titleEn: "Problem solving", titleEs: "Resolución de problemas", type: "mark" },
        { titleEn: "Mathematical reasoning", titleEs: "Razonamiento matemático", type: "mark" },
      ],
    },
    {
      titleEn: "Science",
      titleEs: "Ciencias",
      items: [
        { titleEn: "Scientific inquiry", titleEs: "Indagación científica", type: "mark" },
      ],
    },
    {
      titleEn: "Social Studies",
      titleEs: "Estudios Sociales",
      items: [
        { titleEn: "Community and citizenship", titleEs: "Comunidad y ciudadanía", type: "mark" },
      ],
    },
    {
      titleEn: "Work Habits",
      titleEs: "Hábitos de Trabajo",
      items: [
        { titleEn: "Completes work on time", titleEs: "Completa el trabajo a tiempo", type: "mark" },
        { titleEn: "Works cooperatively", titleEs: "Trabaja cooperativamente", type: "mark" },
      ],
    },
    {
      titleEn: "Teacher Comments",
      titleEs: "Comentarios del Maestro",
      items: [
        { titleEn: "General comments", titleEs: "Comentarios generales", type: "comment" },
      ],
    },
  ];
  
  const itemsBySection: { [key: string]: any[] } = {};
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const { data: createdSection } = await supabase
      .from("template_sections")
      .insert({
        template_id: templateId,
        sort_order: i + 1,
        title_en: section.titleEn,
        title_es: section.titleEs,
        graded_by: "homeroom",
      })
      .select()
      .single();
    
    const sectionId = createdSection!.id;
    
    const itemsToInsert = section.items.map((item, j) => ({
      section_id: sectionId,
      sort_order: j + 1,
      title_en: item.titleEn,
      title_es: item.titleEs,
      item_type: item.type,
      grade_scale_id: item.type === "mark" ? gradeScale.id : null,
      max_chars: item.type === "comment" ? 500 : null,
    }));
    
    const { data: createdItems } = await supabase
      .from("template_items")
      .insert(itemsToInsert)
      .select();
    
    itemsBySection[sectionId] = createdItems!;
  }
  
  console.log(`   ✓ Created ${sections.length} sections with items`);
  
  // Create staff profiles and auth users
  console.log("   Creating staff...");
  
  const staff = [
    {
      fullName: "Alex Morgan",
      email: "demo@studentreportcards.com",
      role: "site_admin" as const,
      password: DEMO_ADMIN_PASSWORD,
    },
    {
      fullName: "Jamie Rivera",
      email: "teacher@demo.academy",
      role: "teacher" as const,
      password: DEMO_TEACHER_PASSWORD || null,
    },
    {
      fullName: "Taylor Chen",
      email: "taylor.chen@demo.academy",
      role: "teacher" as const,
      password: null,
    },
    {
      fullName: "Jordan Kim",
      email: "jordan.kim@demo.academy",
      role: "teacher" as const,
      password: null,
    },
    {
      fullName: "Casey Martinez",
      email: "casey.martinez@demo.academy",
      role: "teacher" as const,
      password: null,
    },
  ];
  
  const createdProfiles: { id: string; email: string; fullName: string }[] = [];
  
  for (const person of staff) {
    // Create auth user with password if provided
    let authUserId: string | null = null;
    
    if (person.password) {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: person.email,
        password: person.password,
        email_confirm: true,
        user_metadata: {
          full_name: person.fullName,
        },
      });
      
      if (authError) {
        console.error(`   ⚠️  Error creating auth user for ${person.email}:`, authError.message);
      } else {
        authUserId = authUser.user.id;
        console.log(`   ✓ Created auth user: ${person.email}`);
      }
    }
    
    // Create or update profile
    let profileId: string;
    
    if (authUserId) {
      // Use auth user ID as profile ID
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: authUserId,
          email: person.email,
          full_name: person.fullName,
          is_system_admin: false,
        })
        .select()
        .single();
      
      if (profileError) {
        console.error(`   ⚠️  Error creating profile for ${person.email}:`, profileError.message);
        continue;
      }
      
      profileId = profile!.id;
    } else {
      // Create profile without auth user
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          email: person.email,
          full_name: person.fullName,
          is_system_admin: false,
        })
        .select()
        .single();
      
      if (profileError) {
        console.error(`   ⚠️  Error creating profile for ${person.email}:`, profileError.message);
        continue;
      }
      
      profileId = profile!.id;
    }
    
    createdProfiles.push({
      id: profileId,
      email: person.email,
      fullName: person.fullName,
    });
    
    // Create site membership
    await supabase.from("site_memberships").insert({
      profile_id: profileId,
      site_id: siteId,
      role: person.role,
    });
  }
  
  console.log(`   ✓ Created ${createdProfiles.length} staff members`);
  
  // Create students
  console.log("   Creating students...");
  
  const studentData = [
    // Grade 3 students
    { firstName: "Emma", lastName: "Johnson", grade: "3", language: "en" },
    { firstName: "Liam", lastName: "Williams", grade: "3", language: "en" },
    { firstName: "Sophia", lastName: "Garcia", grade: "3", language: "es" },
    { firstName: "Noah", lastName: "Rodriguez", grade: "3", language: "es" },
    { firstName: "Olivia", lastName: "Martinez", grade: "3", language: "en" },
    { firstName: "Ethan", lastName: "Lopez", grade: "3", language: "es" },
    { firstName: "Ava", lastName: "Gonzalez", grade: "3", language: "es" },
    { firstName: "Mason", lastName: "Wilson", grade: "3", language: "en" },
    { firstName: "Isabella", lastName: "Anderson", grade: "3", language: "en" },
    { firstName: "Lucas", lastName: "Thomas", grade: "3", language: "en" },
    
    // Grade 4 students
    { firstName: "Mia", lastName: "Taylor", grade: "4", language: "en" },
    { firstName: "Aiden", lastName: "Moore", grade: "4", language: "en" },
    { firstName: "Charlotte", lastName: "Jackson", grade: "4", language: "en" },
    { firstName: "James", lastName: "Martin", grade: "4", language: "es" },
    { firstName: "Amelia", lastName: "Lee", grade: "4", language: "en" },
    { firstName: "Benjamin", lastName: "Perez", grade: "4", language: "es" },
    { firstName: "Harper", lastName: "Thompson", grade: "4", language: "en" },
    { firstName: "Elijah", lastName: "White", grade: "4", language: "en" },
    { firstName: "Evelyn", lastName: "Harris", grade: "4", language: "en" },
    { firstName: "Alexander", lastName: "Sanchez", grade: "4", language: "es" },
    
    // Grade 5 students
    { firstName: "Abigail", lastName: "Clark", grade: "5", language: "en" },
    { firstName: "Michael", lastName: "Ramirez", grade: "5", language: "es" },
    { firstName: "Emily", lastName: "Lewis", grade: "5", language: "en" },
    { firstName: "Daniel", lastName: "Robinson", grade: "5", language: "en" },
    { firstName: "Elizabeth", lastName: "Walker", grade: "5", language: "en" },
    { firstName: "Henry", lastName: "Young", grade: "5", language: "en" },
    { firstName: "Sofia", lastName: "Allen", grade: "5", language: "es" },
    { firstName: "Matthew", lastName: "King", grade: "5", language: "en" },
    { firstName: "Avery", lastName: "Wright", grade: "5", language: "en" },
    { firstName: "Jackson", lastName: "Scott", grade: "5", language: "en" },
  ];
  
  const gradeLevelMap = new Map(gradeLevels.map(gl => [gl.code, gl.id]));
  
  const studentsToInsert = studentData.map((student, i) => ({
    site_id: siteId,
    student_number: `DEMO${String(i + 1).padStart(4, "0")}`,
    first_name: student.firstName,
    last_name: student.lastName,
    preferred_name: student.firstName,
    grade_level_id: gradeLevelMap.get(student.grade)!,
    home_language: student.language,
  }));
  
  const { data: students } = await supabase
    .from("students")
    .insert(studentsToInsert)
    .select();
  
  console.log(`   ✓ Created ${students!.length} students`);
  
  // Create courses
  console.log("   Creating courses...");
  
  const courses = [
    { name: "Grade 3 Homeroom — Rivera", grade: "3", teacherIndex: 1 },
    { name: "Grade 3 Homeroom — Chen", grade: "3", teacherIndex: 2 },
    { name: "Grade 4 Homeroom — Kim", grade: "4", teacherIndex: 3 },
    { name: "Grade 4 Homeroom — Martinez", grade: "4", teacherIndex: 4 },
    { name: "Grade 5 Homeroom — Rivera", grade: "5", teacherIndex: 1 },
    { name: "Grade 5 Homeroom — Chen", grade: "5", teacherIndex: 2 },
  ];
  
  const createdCourses: { id: string; name: string; gradeCode: string; teacherProfileId: string }[] = [];
  
  for (const course of courses) {
    const { data: createdCourse } = await supabase
      .from("courses")
      .insert({
        site_id: siteId,
        academic_year_id: academicYear.id,
        grade_level_id: gradeLevelMap.get(course.grade)!,
        template_id: templateId,
        name: course.name,
      })
      .select()
      .single();
    
    const courseId = createdCourse!.id;
    const teacherProfileId = createdProfiles[course.teacherIndex].id;
    
    // Assign teacher to course
    await supabase.from("course_teachers").insert({
      course_id: courseId,
      profile_id: teacherProfileId,
      can_grade: true,
      can_print: true,
      grades_homeroom: true,
      section_ids: [],
    });
    
    createdCourses.push({
      id: courseId,
      name: course.name,
      gradeCode: course.grade,
      teacherProfileId,
    });
  }
  
  console.log(`   ✓ Created ${createdCourses.length} courses`);
  
  // Create enrollments
  console.log("   Creating enrollments...");
  
  let enrollmentCount = 0;
  
  for (const course of createdCourses) {
    // Get students for this grade
    const gradeStudents = students!.filter(
      s => s.grade_level_id === gradeLevelMap.get(course.gradeCode)!
    );
    
    // Split students roughly evenly across courses of the same grade
    const coursesForGrade = createdCourses.filter(c => c.gradeCode === course.gradeCode);
    const courseIndex = coursesForGrade.indexOf(course);
    const studentsPerCourse = Math.ceil(gradeStudents.length / coursesForGrade.length);
    const startIndex = courseIndex * studentsPerCourse;
    const endIndex = Math.min(startIndex + studentsPerCourse, gradeStudents.length);
    const courseStudents = gradeStudents.slice(startIndex, endIndex);
    
    const enrollments = courseStudents.map(student => ({
      course_id: course.id,
      student_id: student.id,
    }));
    
    if (enrollments.length > 0) {
      await supabase.from("enrollments").insert(enrollments);
      enrollmentCount += enrollments.length;
    }
  }
  
  console.log(`   ✓ Created ${enrollmentCount} enrollments`);
  
  // Create grades for the first term
  console.log("   Creating sample grades for Trimester 1...");
  
  const term1 = terms![0];
  const allItems = Object.values(itemsBySection).flat();
  const markItems = allItems.filter(item => item.item_type === "mark");
  const commentItems = allItems.filter(item => item.item_type === "comment");
  
  let gradeCount = 0;
  
  // Get all enrollments
  const { data: allEnrollments } = await supabase
    .from("enrollments")
    .select("*")
    .in("course_id", createdCourses.map(c => c.id));
  
  // Sample comments for variety
  const comments = [
    "Excellent progress this term!",
    "Shows strong understanding of concepts.",
    "Making steady progress with consistent effort.",
    "Would benefit from additional practice at home.",
    "Actively participates and asks thoughtful questions.",
    "Demonstrates creativity and independent thinking.",
    "Works well collaboratively with peers.",
    "Continue to build confidence in this area.",
  ];
  
  for (const enrollment of allEnrollments!) {
    // Create grades for mark items
    for (const item of markItems) {
      // Randomly assign marks with a realistic distribution
      // 40% S, 30% E, 25% N, 5% U
      const rand = Math.random();
      let markCode: string;
      if (rand < 0.4) markCode = "S";
      else if (rand < 0.7) markCode = "E";
      else if (rand < 0.95) markCode = "N";
      else markCode = "U";
      
      const mark = marks.find(m => m.code === markCode);
      
      await supabase.from("grades").insert({
        enrollment_id: enrollment.id,
        term_id: term1.id,
        template_item_id: item.id,
        mark_id: mark!.id,
        comment: "",
      });
      
      gradeCount++;
    }
    
    // Create comment for comment items
    for (const item of commentItems) {
      const randomComment = comments[Math.floor(Math.random() * comments.length)];
      
      await supabase.from("grades").insert({
        enrollment_id: enrollment.id,
        term_id: term1.id,
        template_item_id: item.id,
        mark_id: null,
        comment: randomComment,
      });
      
      gradeCount++;
    }
  }
  
  console.log(`   ✓ Created ${gradeCount} grades`);
  
  console.log("\n✅ Demo Academy seeding complete!");
  console.log("\nDemo Login Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Site Admin:");
  console.log(`  Email:    demo@studentreportcards.com`);
  console.log(`  Password: ${DEMO_ADMIN_PASSWORD}`);
  
  if (DEMO_TEACHER_PASSWORD) {
    console.log("\nTeacher:");
    console.log(`  Email:    teacher@demo.academy`);
    console.log(`  Password: ${DEMO_TEACHER_PASSWORD}`);
  }
  
  console.log("\n📊 Summary:");
  console.log(`  Site:      ${DEMO_SITE_NAME} (${DEMO_SITE_CODE})`);
  console.log(`  Year:      2026–27 with 3 terms`);
  console.log(`  Staff:     ${createdProfiles.length} (1 admin, ${createdProfiles.length - 1} teachers)`);
  console.log(`  Students:  ${students!.length} (across grades 3-5)`);
  console.log(`  Courses:   ${createdCourses.length}`);
  console.log(`  Grades:    ${gradeCount} (Trimester 1 only)`);
  console.log("");
}

async function main() {
  const command = process.argv[2];
  
  if (command === "reset" || command === "--reset") {
    await reset();
    await seed();
  } else {
    // Check if demo site already exists
    const { data: existingSite } = await supabase
      .from("sites")
      .select("id")
      .eq("code", DEMO_SITE_CODE)
      .maybeSingle();
    
    if (existingSite) {
      console.log("\n⚠️  Demo Academy already exists!");
      console.log("   Run with 'reset' to delete and recreate: npm run demo:reset");
      process.exit(1);
    }
    
    await seed();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
