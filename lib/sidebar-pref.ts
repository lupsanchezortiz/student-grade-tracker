export const SIDEBAR_COOKIE = "sis_sidebar";

export type SidebarPref = {
  collapsed: boolean;
  pinned: boolean;
};

export const DEFAULT_SIDEBAR_PREF: SidebarPref = {
  collapsed: false,
  pinned: true,
};

export function parseSidebarPref(value?: string): SidebarPref {
  if (!value) return DEFAULT_SIDEBAR_PREF;
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<SidebarPref>;
    return {
      collapsed: Boolean(parsed.collapsed),
      pinned: parsed.pinned !== false,
    };
  } catch {
    return DEFAULT_SIDEBAR_PREF;
  }
}

export function writeSidebarPref(pref: SidebarPref) {
  document.cookie = `${SIDEBAR_COOKIE}=${encodeURIComponent(JSON.stringify(pref))}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}
