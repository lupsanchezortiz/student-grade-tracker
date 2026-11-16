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

async function reset() {
  console.log("\n🗑️  Resetting Demo Academy...");
  
  // Find demo site
  const { data: sites, error: sitesError } = await supabase
    .from("sites")
    .select("id")
    .eq("code", DEMO_SITE_CODE);
  
  if (sitesError) {
    throw new Error(`Failed to find demo site: ${sitesError.message}`);
  }
  
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
    throw new Error(`Failed to delete courses: ${coursesError.message}`);
  }
  console.log("   ✓ Deleted courses and related data");
  
  // Delete students
  const { error: studentsError } = await supabase
    .from("students")
    .delete()
    .eq("site_id", siteId);
  
  if (studentsError) {
    throw new Error(`Failed to delete students: ${studentsError.message}`);
  }
  console.log("   ✓ Deleted students");
  
  // Delete site memberships (must be before deleting profiles/auth users)
  const { error: membershipsError } = await supabase
    .from("site_memberships")
    .delete()
    .eq("site_id", siteId);
  
  if (membershipsError) {
    throw new Error(`Failed to delete memberships: ${membershipsError.message}`);
  }
  console.log("   ✓ Deleted site memberships");
  
  // Delete demo auth users (cascades to profiles via FK)
  const demoEmails = [
    "demo@studentreportcards.com",
    "teacher@demo.academy",
    "taylor.chen@demo.academy",
    "jordan.kim@demo.academy",
    "casey.martinez@demo.academy",
  ];
  
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    throw new Error(`Failed to list auth users: ${listError.message}`);
  }
  
  for (const email of demoEmails) {
    const demoUser = usersData.users.find(u => u.email?.toLowerCase() === email);
    
    if (demoUser) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(demoUser.id);
      if (deleteError) {
        throw new Error(`Failed to delete auth user ${email}: ${deleteError.message}`);
      }
      console.log(`   ✓ Deleted auth user: ${email}`);
    }
  }
  
  // Delete demo template (district-level, not site-scoped in schema)
  const { error: templateError } = await supabase
    .from("report_card_templates")
    .delete()
    .eq("name", "Demo Elementary Progress Report");
  
  if (templateError) {
    throw new Error(`Failed to delete demo template: ${templateError.message}`);
  }
  console.log("   ✓ Deleted demo template");
  
  // Delete site
  const { error: siteError } = await supabase
    .from("sites")
    .delete()
    .eq("id", siteId);
  
  if (siteError) {
    throw new Error(`Failed to delete site: ${siteError.message}`);
  }
  console.log("   ✓ Deleted demo site");
  
  return siteId;
}

async function seed() {
  console.log("\n🌱 Seeding Demo Academy...");
  
  // Get or create grade levels (district catalog)
  const { data: existingLevels, error: levelsError } = await supabase
    .from("grade_levels")
    .select("*")
    .order("sort_order");
  
  if (levelsError) {
    throw new Error(`Failed to fetch grade levels: ${levelsError.message}`);
  }
  
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
    
    const { data: createdLevels, error: createLevelsError } = await supabase
      .from("grade_levels")
      .insert(levels.map(l => ({
        code: l.code,
        name_en: l.nameEn,
        name_es: l.nameEs,
        sort_order: l.sortOrder,
      })))
      .select();
    
    if (createLevelsError) {
      throw new Error(`Failed to create grade levels: ${createLevelsError.message}`);
    }
    
    gradeLevels = createdLevels.map(l => ({
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
  const { data: existingYears, error: yearsError } = await supabase
    .from("academic_years")
    .select("*")
    .eq("name", "2026–27");
  
  if (yearsError) {
    throw new Error(`Failed to fetch academic years: ${yearsError.message}`);
  }
  
  let academicYear: AcademicYear;
  
  if (!existingYears || existingYears.length === 0) {
    console.log("   Creating academic year 2026–27...");
    const { data: createdYear, error: createYearError } = await supabase
      .from("academic_years")
      .insert({
        name: "2026–27",
        start_date: "2026-08-17",
        end_date: "2027-06-11",
        term_structure: "trimester",
      })
      .select()
      .single();
    
    if (createYearError) {
      throw new Error(`Failed to create academic year: ${createYearError.message}`);
    }
    
    academicYear = {
      id: createdYear.id,
      name: createdYear.name,
      startDate: createdYear.start_date,
      endDate: createdYear.end_date,
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
  const { data: existingScales, error: scalesError } = await supabase
    .from("grade_scales")
    .select("*")
    .eq("name", "E / S / N / U");
  
  if (scalesError) {
    throw new Error(`Failed to fetch grade scales: ${scalesError.message}`);
  }
  
  let gradeScale: GradeScale;
  let marks: GradeScaleMark[] = [];
  
  if (!existingScales || existingScales.length === 0) {
    console.log("   Creating grade scale...");
    const { data: createdScale, error: createScaleError } = await supabase
      .from("grade_scales")
      .insert({ name: "E / S / N / U" })
      .select()
      .single();
    
    if (createScaleError) {
      throw new Error(`Failed to create grade scale: ${createScaleError.message}`);
    }
    
    gradeScale = { id: createdScale.id, name: createdScale.name };
    
    const markData = [
      { code: "E", labelEn: "Exceeds", labelEs: "Sobresaliente", sortOrder: 1, isPassing: true },
      { code: "S", labelEn: "Satisfactory", labelEs: "Satisfactorio", sortOrder: 2, isPassing: true },
      { code: "N", labelEn: "Needs improvement", labelEs: "Necesita mejorar", sortOrder: 3, isPassing: true },
      { code: "U", labelEn: "Unsatisfactory", labelEs: "Insatisfactorio", sortOrder: 4, isPassing: false },
    ];
    
    const { data: createdMarks, error: createMarksError } = await supabase
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
    
    if (createMarksError) {
      throw new Error(`Failed to create grade scale marks: ${createMarksError.message}`);
    }
    
    marks = createdMarks.map(m => ({
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
    
    const { data: existingMarks, error: marksError } = await supabase
      .from("grade_scale_marks")
      .select("*")
      .eq("scale_id", gradeScale.id)
      .order("sort_order");
    
    if (marksError) {
      throw new Error(`Failed to fetch grade scale marks: ${marksError.message}`);
    }
    
    marks = existingMarks.map(m => ({
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
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .insert({
      name: DEMO_SITE_NAME,
      code: DEMO_SITE_CODE,
      address: "1234 Education Lane, Demo City, DC 12345",
    })
    .select()
    .single();
  
  if (siteError) {
    throw new Error(`Failed to create site: ${siteError.message}`);
  }
  
  const siteId = site.id;
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
  
  const { data: terms, error: termsError } = await supabase
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
  
  if (termsError) {
    throw new Error(`Failed to create terms: ${termsError.message}`);
  }
  
  console.log(`   ✓ Created ${terms.length} terms`);
  
  // Create report card template (district-level, not site-scoped in schema)
  console.log("   Creating report card template...");
  const { data: template, error: templateError } = await supabase
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
  
  if (templateError) {
    throw new Error(`Failed to create template: ${templateError.message}`);
  }
  
  const templateId = template.id;
  console.log(`   ✓ Created template: ${templateId}`);
  
  // Link template to grade levels 1-5
  const templateGradeLevels = gradeLevels
    .filter(gl => ["1", "2", "3", "4", "5"].includes(gl.code))
    .map(gl => ({
      template_id: templateId,
      grade_level_id: gl.id,
    }));
  
  const { error: templateGradeLevelsError } = await supabase
    .from("template_grade_levels")
    .insert(templateGradeLevels);
  
  if (templateGradeLevelsError) {
    throw new Error(`Failed to link template to grade levels: ${templateGradeLevelsError.message}`);
  }
  
  console.log(`   ✓ Linked template to grades 1-5`);
  
  // Create template sections and items
  console.log("   Creating template sections and items...");
  const sections = [
    {
      titleEn: "Language Arts",
      titleEs: "Artes del Lenguaje",
      items: [
        { titleEn: "Reading comprehension", titleEs: "Comprensión de lectura", type: "mark" as const },
        { titleEn: "Writing skills", titleEs: "Habilidades de escritura", type: "mark" as const },
        { titleEn: "Speaking and listening", titleEs: "Hablar y escuchar", type: "mark" as const },
      ],
    },
    {
      titleEn: "Mathematics",
      titleEs: "Matemáticas",
      items: [
        { titleEn: "Number operations", titleEs: "Operaciones numéricas", type: "mark" as const },
        { titleEn: "Problem solving", titleEs: "Resolución de problemas", type: "mark" as const },
        { titleEn: "Mathematical reasoning", titleEs: "Razonamiento matemático", type: "mark" as const },
      ],
    },
    {
      titleEn: "Science",
      titleEs: "Ciencias",
      items: [
        { titleEn: "Scientific inquiry", titleEs: "Indagación científica", type: "mark" as const },
      ],
    },
    {
      titleEn: "Social Studies",
      titleEs: "Estudios Sociales",
      items: [
        { titleEn: "Community and citizenship", titleEs: "Comunidad y ciudadanía", type: "mark" as const },
      ],
    },
    {
      titleEn: "Work Habits",
      titleEs: "Hábitos de Trabajo",
      items: [
        { titleEn: "Completes work on time", titleEs: "Completa el trabajo a tiempo", type: "mark" as const },
        { titleEn: "Works cooperatively", titleEs: "Trabaja cooperativamente", type: "mark" as const },
      ],
    },
    {
      titleEn: "Teacher Comments",
      titleEs: "Comentarios del Maestro",
      items: [
        { titleEn: "General comments", titleEs: "Comentarios generales", type: "comment" as const },
      ],
    },
  ];
  
  const itemsBySection: { [key: string]: any[] } = {};
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const { data: createdSection, error: sectionError } = await supabase
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
    
    if (sectionError) {
      throw new Error(`Failed to create template section "${section.titleEn}": ${sectionError.message}`);
    }
    
    const sectionId = createdSection.id;
    
    const itemsToInsert = section.items.map((item, j) => ({
      section_id: sectionId,
      sort_order: j + 1,
      title_en: item.titleEn,
      title_es: item.titleEs,
      item_type: item.type,
      grade_scale_id: item.type === "mark" ? gradeScale.id : null,
      max_chars: item.type === "comment" ? 500 : null,
    }));
    
    const { data: createdItems, error: itemsError } = await supabase
      .from("template_items")
      .insert(itemsToInsert)
      .select();
    
    if (itemsError) {
      throw new Error(`Failed to create template items for section "${section.titleEn}": ${itemsError.message}`);
    }
    
    itemsBySection[sectionId] = createdItems;
  }
  
  console.log(`   ✓ Created ${sections.length} sections with items`);
  
  // Create staff auth users and profiles
  // ALL staff get auth users (required for profiles.id FK). Only admin and teacher
  // (if DEMO_TEACHER_PASSWORD set) get the env password; others get random unguessable passwords.
  console.log("   Creating staff...");
  
  const staff = [
    {
      fullName: "Alex Morgan",
      email: "demo@studentreportcards.com",
      role: "site_admin" as const,
      useEnvPassword: true,
      envPassword: DEMO_ADMIN_PASSWORD,
    },
    {
      fullName: "Jamie Rivera",
      email: "teacher@demo.academy",
      role: "teacher" as const,
      useEnvPassword: !!DEMO_TEACHER_PASSWORD,
      envPassword: DEMO_TEACHER_PASSWORD,
    },
    {
      fullName: "Taylor Chen",
      email: "taylor.chen@demo.academy",
      role: "teacher" as const,
      useEnvPassword: false,
      envPassword: null,
    },
    {
      fullName: "Jordan Kim",
      email: "jordan.kim@demo.academy",
      role: "teacher" as const,
      useEnvPassword: false,
      envPassword: null,
    },
    {
      fullName: "Casey Martinez",
      email: "casey.martinez@demo.academy",
      role: "teacher" as const,
      useEnvPassword: false,
      envPassword: null,
    },
  ];
  
  const createdProfiles: { id: string; email: string; fullName: string }[] = [];
  
  for (const person of staff) {
    // Generate a random unguessable password for non-login staff
    const password = person.useEnvPassword
      ? person.envPassword!
      : `demo-nologin-${crypto.randomUUID()}-${Date.now()}`;
    
    // Create auth user (this triggers handle_new_user which creates the profile)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: person.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: person.fullName,
      },
    });
    
    if (authError) {
      throw new Error(`Failed to create auth user for ${person.email}: ${authError.message}`);
    }
    
    const profileId = authUser.user.id;
    console.log(`   ✓ Created auth user: ${person.email}${person.useEnvPassword ? " (login enabled)" : " (no login)"}`);
    
    // The handle_new_user trigger already created the profile, but we may need to update it
    // if the trigger used default values instead of our full_name
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        email: person.email,
        full_name: person.fullName,
        is_system_admin: false,
      })
      .eq("id", profileId);
    
    if (updateError) {
      throw new Error(`Failed to update profile for ${person.email}: ${updateError.message}`);
    }
    
    createdProfiles.push({
      id: profileId,
      email: person.email,
      fullName: person.fullName,
    });
    
    // Create site membership
    const { error: membershipError } = await supabase.from("site_memberships").insert({
      profile_id: profileId,
      site_id: siteId,
      role: person.role,
    });
    
    if (membershipError) {
      throw new Error(`Failed to create site membership for ${person.email}: ${membershipError.message}`);
    }
  }
  
  console.log(`   ✓ Created ${createdProfiles.length} staff members`);
  
  // Create students
  console.log("   Creating students...");
  
  const studentData = [
    // Grade 3 students
    { firstName: "Emma", lastName: "Johnson", grade: "3", language: "en" as const },
    { firstName: "Liam", lastName: "Williams", grade: "3", language: "en" as const },
    { firstName: "Sophia", lastName: "Garcia", grade: "3", language: "es" as const },
    { firstName: "Noah", lastName: "Rodriguez", grade: "3", language: "es" as const },
    { firstName: "Olivia", lastName: "Martinez", grade: "3", language: "en" as const },
    { firstName: "Ethan", lastName: "Lopez", grade: "3", language: "es" as const },
    { firstName: "Ava", lastName: "Gonzalez", grade: "3", language: "es" as const },
    { firstName: "Mason", lastName: "Wilson", grade: "3", language: "en" as const },
    { firstName: "Isabella", lastName: "Anderson", grade: "3", language: "en" as const },
    { firstName: "Lucas", lastName: "Thomas", grade: "3", language: "en" as const },
    
    // Grade 4 students
    { firstName: "Mia", lastName: "Taylor", grade: "4", language: "en" as const },
    { firstName: "Aiden", lastName: "Moore", grade: "4", language: "en" as const },
    { firstName: "Charlotte", lastName: "Jackson", grade: "4", language: "en" as const },
    { firstName: "James", lastName: "Martin", grade: "4", language: "es" as const },
    { firstName: "Amelia", lastName: "Lee", grade: "4", language: "en" as const },
    { firstName: "Benjamin", lastName: "Perez", grade: "4", language: "es" as const },
    { firstName: "Harper", lastName: "Thompson", grade: "4", language: "en" as const },
    { firstName: "Elijah", lastName: "White", grade: "4", language: "en" as const },
    { firstName: "Evelyn", lastName: "Harris", grade: "4", language: "en" as const },
    { firstName: "Alexander", lastName: "Sanchez", grade: "4", language: "es" as const },
    
    // Grade 5 students
    { firstName: "Abigail", lastName: "Clark", grade: "5", language: "en" as const },
    { firstName: "Michael", lastName: "Ramirez", grade: "5", language: "es" as const },
    { firstName: "Emily", lastName: "Lewis", grade: "5", language: "en" as const },
    { firstName: "Daniel", lastName: "Robinson", grade: "5", language: "en" as const },
    { firstName: "Elizabeth", lastName: "Walker", grade: "5", language: "en" as const },
    { firstName: "Henry", lastName: "Young", grade: "5", language: "en" as const },
    { firstName: "Sofia", lastName: "Allen", grade: "5", language: "es" as const },
    { firstName: "Matthew", lastName: "King", grade: "5", language: "en" as const },
    { firstName: "Avery", lastName: "Wright", grade: "5", language: "en" as const },
    { firstName: "Jackson", lastName: "Scott", grade: "5", language: "en" as const },
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
  
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .insert(studentsToInsert)
    .select();
  
  if (studentsError) {
    throw new Error(`Failed to create students: ${studentsError.message}`);
  }
  
  console.log(`   ✓ Created ${students.length} students`);
  
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
    const { data: createdCourse, error: courseError } = await supabase
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
    
    if (courseError) {
      throw new Error(`Failed to create course "${course.name}": ${courseError.message}`);
    }
    
    const courseId = createdCourse.id;
    const teacherProfileId = createdProfiles[course.teacherIndex].id;
    
    // Assign teacher to course
    const { error: teacherError } = await supabase.from("course_teachers").insert({
      course_id: courseId,
      profile_id: teacherProfileId,
      can_grade: true,
      can_print: true,
      grades_homeroom: true,
      section_ids: [],
    });
    
    if (teacherError) {
      throw new Error(`Failed to assign teacher to course "${course.name}": ${teacherError.message}`);
    }
    
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
    const gradeStudents = students.filter(
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
      const { error: enrollmentsError } = await supabase.from("enrollments").insert(enrollments);
      if (enrollmentsError) {
        throw new Error(`Failed to create enrollments for course "${course.name}": ${enrollmentsError.message}`);
      }
      enrollmentCount += enrollments.length;
    }
  }
  
  console.log(`   ✓ Created ${enrollmentCount} enrollments`);
  
  // Create grades for the first term
  console.log("   Creating sample grades for Trimester 1...");
  
  const term1 = terms[0];
  const allItems = Object.values(itemsBySection).flat();
  const markItems = allItems.filter(item => item.item_type === "mark");
  const commentItems = allItems.filter(item => item.item_type === "comment");
  
  let gradeCount = 0;
  
  // Get all enrollments
  const { data: allEnrollments, error: enrollmentsQueryError } = await supabase
    .from("enrollments")
    .select("*")
    .in("course_id", createdCourses.map(c => c.id));
  
  if (enrollmentsQueryError) {
    throw new Error(`Failed to fetch enrollments: ${enrollmentsQueryError.message}`);
  }
  
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
  
  for (const enrollment of allEnrollments) {
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
      if (!mark) {
        throw new Error(`Mark with code ${markCode} not found`);
      }
      
      const { error: gradeError } = await supabase.from("grades").insert({
        enrollment_id: enrollment.id,
        term_id: term1.id,
        template_item_id: item.id,
        mark_id: mark.id,
        comment: "",
      });
      
      if (gradeError) {
        throw new Error(`Failed to create grade for enrollment ${enrollment.id}: ${gradeError.message}`);
      }
      
      gradeCount++;
    }
    
    // Create comment for comment items
    for (const item of commentItems) {
      const randomComment = comments[Math.floor(Math.random() * comments.length)];
      
      const { error: commentError } = await supabase.from("grades").insert({
        enrollment_id: enrollment.id,
        term_id: term1.id,
        template_item_id: item.id,
        mark_id: null,
        comment: randomComment,
      });
      
      if (commentError) {
        throw new Error(`Failed to create comment for enrollment ${enrollment.id}: ${commentError.message}`);
      }
      
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
  
  console.log("\nNote: All 5 staff members have auth accounts, but only the accounts");
  console.log("above have login credentials. Other staff use random unguessable passwords.");
  
  console.log("\n📊 Summary:");
  console.log(`  Site:      ${DEMO_SITE_NAME} (${DEMO_SITE_CODE})`);
  console.log(`  Year:      2026–27 with 3 terms`);
  console.log(`  Staff:     ${createdProfiles.length} (1 admin, ${createdProfiles.length - 1} teachers)`);
  console.log(`  Students:  ${students.length} (across grades 3-5)`);
  console.log(`  Courses:   ${createdCourses.length}`);
  console.log(`  Grades:    ${gradeCount} (Trimester 1 only)`);
  console.log(`  Template:  District-level (deleted on reset)`);
  console.log("");
}

async function main() {
  const command = process.argv[2];
  
  if (command === "reset" || command === "--reset") {
    await reset();
    await seed();
  } else {
    // Check if demo site already exists
    const { data: existingSite, error: checkError } = await supabase
      .from("sites")
      .select("id")
      .eq("code", DEMO_SITE_CODE)
      .maybeSingle();
    
    if (checkError) {
      throw new Error(`Failed to check for existing demo site: ${checkError.message}`);
    }
    
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
