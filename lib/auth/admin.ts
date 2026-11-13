import { createClient } from "@supabase/supabase-js";

export type AuthUserResult =
  | { success: true; action: "invited" | "linked" | "skipped" }
  | { success: false; reason: string };

/**
 * Creates or links a Supabase Auth user for staff import.
 * Uses the service role key (admin API) to invite users or link existing auth accounts.
 * 
 * @param email - Staff member's email
 * @param fullName - Staff member's full name
 * @param profileId - The profile ID to link (should match the auth user ID if exists)
 * @returns Result indicating what action was taken or why it failed
 */
export async function ensureAuthUser(
  email: string,
  fullName: string,
  profileId?: string,
): Promise<AuthUserResult> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey) {
    return { success: false, reason: "SUPABASE_SERVICE_ROLE_KEY not configured" };
  }

  if (!supabaseUrl) {
    return { success: false, reason: "NEXT_PUBLIC_SUPABASE_URL not configured" };
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return { success: false, reason: "Invalid email address" };
  }

  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: listResult, error: listError } = await adminClient.auth.admin.listUsers();

    if (listError) {
      return { success: false, reason: listError.message };
    }

    const existingUser = listResult.users.find(u => u.email?.toLowerCase() === normalizedEmail);

    if (existingUser) {
      if (profileId && existingUser.id !== profileId) {
        return {
          success: false,
          reason: `Auth user exists with different ID (${existingUser.id} vs ${profileId})`,
        };
      }
      return { success: true, action: "linked" };
    }

    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
      data: {
        full_name: fullName,
      },
    });

    if (inviteError) {
      if (inviteError.message.toLowerCase().includes("already exists") || 
          inviteError.message.toLowerCase().includes("already registered")) {
        return { success: true, action: "linked" };
      }
      return { success: false, reason: inviteError.message };
    }

    return { success: true, action: "invited" };
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : "Unknown error creating auth user",
    };
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
