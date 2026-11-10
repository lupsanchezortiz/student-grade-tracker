import { createServerSupabase } from "@/lib/supabase/server";
import type {
  Student,
  SiteRole,
  Profile,
  Course,
  Enrollment,
  CourseTeacher,
} from "@/lib/types";

export async function listStudentsSupabase(siteId: string): Promise<Student[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("site_id", siteId)
    .order("last_name")
    .order("first_name");

  if (error) throw new Error(`Failed to list students: ${error.message}`);
  
  return (data || []).map((row) => ({
    id: row.id,
    siteId: row.site_id,
    studentNumber: row.student_number,
    firstName: row.first_name,
    lastName: row.last_name,
    preferredName: row.preferred_name || row.first_name,
    gradeLevelId: row.grade_level_id,
    homeLanguage: row.home_language as "en" | "es",
  }));
}

export async function createStudentSupabase(
  siteId: string,
  input: Omit<Student, "id" | "siteId">,
): Promise<Student> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("students")
    .insert({
      site_id: siteId,
      student_number: input.studentNumber.trim(),
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      preferred_name: input.preferredName.trim() || input.firstName.trim(),
      grade_level_id: input.gradeLevelId,
      home_language: input.homeLanguage,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create student: ${error.message}`);

  return {
    id: data.id,
    siteId: data.site_id,
    studentNumber: data.student_number,
    firstName: data.first_name,
    lastName: data.last_name,
    preferredName: data.preferred_name,
    gradeLevelId: data.grade_level_id,
    homeLanguage: data.home_language as "en" | "es",
  };
}

export async function updateStudentSupabase(
  studentId: string,
  input: Omit<Student, "id" | "siteId">,
): Promise<Student> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("students")
    .update({
      student_number: input.studentNumber.trim(),
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      preferred_name: input.preferredName.trim() || input.firstName.trim(),
      grade_level_id: input.gradeLevelId,
      home_language: input.homeLanguage,
    })
    .eq("id", studentId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update student: ${error.message}`);

  return {
    id: data.id,
    siteId: data.site_id,
    studentNumber: data.student_number,
    firstName: data.first_name,
    lastName: data.last_name,
    preferredName: data.preferred_name,
    gradeLevelId: data.grade_level_id,
    homeLanguage: data.home_language as "en" | "es",
  };
}

export async function listStaffSupabase(
  siteId: string,
): Promise<Array<{ id: string; profileId: string; siteId: string; role: SiteRole; profile: Profile }>> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("site_memberships")
    .select(
      `
      id,
      profile_id,
      site_id,
      role,
      profiles(
        id,
        email,
        full_name,
        is_system_admin
      )
    `,
    )
    .eq("site_id", siteId);

  if (error) throw new Error(`Failed to list staff: ${error.message}`);

  type ProfileRow = { id: string; email: string; full_name: string; is_system_admin: boolean };
  
  return (data || []).map((row) => {
    const profile = row.profiles as ProfileRow | ProfileRow[] | null;
    const profileData = Array.isArray(profile) ? profile[0] : profile;
    if (!profileData) {
      throw new Error(`Profile not found for membership ${row.id}`);
    }
    return {
      id: row.id,
      profileId: row.profile_id,
      siteId: row.site_id,
      role: row.role as SiteRole,
      profile: {
        id: profileData.id,
        email: profileData.email,
        fullName: profileData.full_name,
        isSystemAdmin: profileData.is_system_admin,
      },
    };
  }).sort((a, b) => a.profile.fullName.localeCompare(b.profile.fullName));
}

export async function addStaffSupabase(
  siteId: string,
  input: { fullName: string; email: string; role: SiteRole },
): Promise<{ id: string; profileId: string; siteId: string; role: SiteRole; profile: Profile }> {
  const supabase = await createServerSupabase();
  const email = input.email.trim().toLowerCase();

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (!profile) {
    const { data: newProfile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        email,
        full_name: input.fullName.trim(),
        is_system_admin: false,
      })
      .select()
      .single();

    if (profileError) throw new Error(`Failed to create profile: ${profileError.message}`);
    profile = newProfile;
  }

  const { data: existing } = await supabase
    .from("site_memberships")
    .select("*")
    .eq("profile_id", profile.id)
    .eq("site_id", siteId)
    .maybeSingle();

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("site_memberships")
      .update({ role: input.role })
      .eq("id", existing.id)
      .select()
      .single();

    if (updateError) throw new Error(`Failed to update membership: ${updateError.message}`);

    return {
      id: updated.id,
      profileId: updated.profile_id,
      siteId: updated.site_id,
      role: updated.role as SiteRole,
      profile: {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        isSystemAdmin: profile.is_system_admin,
      },
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("site_memberships")
    .insert({
      profile_id: profile.id,
      site_id: siteId,
      role: input.role,
    })
    .select()
    .single();

  if (membershipError) throw new Error(`Failed to create membership: ${membershipError.message}`);

  return {
    id: membership.id,
    profileId: membership.profile_id,
    siteId: membership.site_id,
    role: membership.role as SiteRole,
    profile: {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      isSystemAdmin: profile.is_system_admin,
    },
  };
}

export async function listCoursesSupabase(siteId: string): Promise<string[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("courses")
    .select("id")
    .eq("site_id", siteId);

  if (error) throw new Error(`Failed to list courses: ${error.message}`);
  return (data || []).map((row) => row.id);
}

export async function createCourseSupabase(
  siteId: string,
  input: { name: string; academicYearId: string; gradeLevelId: string; templateId: string },
): Promise<Course> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("courses")
    .insert({
      site_id: siteId,
      name: input.name.trim(),
      academic_year_id: input.academicYearId,
      grade_level_id: input.gradeLevelId,
      template_id: input.templateId,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create course: ${error.message}`);

  return {
    id: data.id,
    siteId: data.site_id,
    academicYearId: data.academic_year_id,
    gradeLevelId: data.grade_level_id,
    templateId: data.template_id,
    name: data.name,
  };
}

export async function setEnrollmentsSupabase(courseId: string, studentIds: string[]): Promise<void> {
  const supabase = await createServerSupabase();

  const { data: existing } = await supabase
    .from("enrollments")
    .select("id, student_id")
    .eq("course_id", courseId);

  const existingMap = new Map((existing || []).map((e) => [e.student_id, e.id]));
  const keepIds = new Set(studentIds);

  const toDelete = Array.from(existingMap.entries())
    .filter(([studentId]) => !keepIds.has(studentId))
    .map(([, id]) => id);

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("enrollments")
      .delete()
      .in("id", toDelete);

    if (deleteError) throw new Error(`Failed to delete enrollments: ${deleteError.message}`);
  }

  const toAdd = studentIds.filter((studentId) => !existingMap.has(studentId));

  if (toAdd.length > 0) {
    const { error: insertError } = await supabase
      .from("enrollments")
      .insert(toAdd.map((studentId) => ({ course_id: courseId, student_id: studentId })));

    if (insertError) throw new Error(`Failed to create enrollments: ${insertError.message}`);
  }
}

export async function setCourseTeachersSupabase(
  courseId: string,
  teachers: {
    profileId: string;
    canGrade: boolean;
    canPrint: boolean;
    gradesHomeroom?: boolean;
    sectionIds?: string[];
  }[],
): Promise<void> {
  const supabase = await createServerSupabase();

  const { error: deleteError } = await supabase
    .from("course_teachers")
    .delete()
    .eq("course_id", courseId);

  if (deleteError) throw new Error(`Failed to clear course teachers: ${deleteError.message}`);

  if (teachers.length > 0) {
    const { error: insertError } = await supabase
      .from("course_teachers")
      .insert(
        teachers.map((t) => ({
          course_id: courseId,
          profile_id: t.profileId,
          can_grade: t.canGrade,
          can_print: t.canPrint,
          grades_homeroom: t.gradesHomeroom ?? (t.canGrade && (t.sectionIds?.length ?? 0) === 0),
          section_ids: t.sectionIds ?? [],
        })),
      );

    if (insertError) throw new Error(`Failed to add course teachers: ${insertError.message}`);
  }
}

export async function getEnrollmentsSupabase(courseId: string): Promise<Enrollment[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("enrollments")
    .select("*")
    .eq("course_id", courseId);

  if (error) throw new Error(`Failed to get enrollments: ${error.message}`);

  return (data || []).map((row) => ({
    id: row.id,
    courseId: row.course_id,
    studentId: row.student_id,
  }));
}

export async function getCourseTeachersSupabase(courseId: string): Promise<CourseTeacher[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("course_teachers")
    .select("*")
    .eq("course_id", courseId);

  if (error) throw new Error(`Failed to get course teachers: ${error.message}`);

  return (data || []).map((row) => ({
    id: row.id,
    courseId: row.course_id,
    profileId: row.profile_id,
    canGrade: row.can_grade,
    canPrint: row.can_print,
    gradesHomeroom: row.grades_homeroom,
    sectionIds: row.section_ids || [],
  }));
}

export async function getStudentByIdSupabase(studentId: string): Promise<Student | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .maybeSingle();

  if (error) throw new Error(`Failed to get student: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    siteId: data.site_id,
    studentNumber: data.student_number,
    firstName: data.first_name,
    lastName: data.last_name,
    preferredName: data.preferred_name,
    gradeLevelId: data.grade_level_id,
    homeLanguage: data.home_language as "en" | "es",
  };
}

export async function getCourseSupabase(courseId: string): Promise<Course | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();

  if (error) throw new Error(`Failed to get course: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    siteId: data.site_id,
    academicYearId: data.academic_year_id,
    gradeLevelId: data.grade_level_id,
    templateId: data.template_id,
    name: data.name,
  };
}

export async function getProfileByEmailSupabase(email: string): Promise<Profile | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error) throw new Error(`Failed to get profile: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    isSystemAdmin: data.is_system_admin,
  };
}

export async function listAllCoursesSupabase(): Promise<string[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("courses")
    .select("id");

  if (error) throw new Error(`Failed to list all courses: ${error.message}`);
  return (data || []).map((row) => row.id);
}

export async function updateCourseSupabase(
  courseId: string,
  updates: { gradeLevelId?: string; templateId?: string; name?: string },
): Promise<void> {
  const supabase = await createServerSupabase();
  const payload: { grade_level_id?: string; template_id?: string; name?: string } = {};
  
  if (updates.gradeLevelId) payload.grade_level_id = updates.gradeLevelId;
  if (updates.templateId) payload.template_id = updates.templateId;
  if (updates.name) payload.name = updates.name;

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase
    .from("courses")
    .update(payload)
    .eq("id", courseId);

  if (error) throw new Error(`Failed to update course: ${error.message}`);
}
