"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  Building2,
  CalendarRange,
  ClipboardList,
  FileUp,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeft,
  PanelLeftClose,
  Pin,
  PinOff,
  Scale,
  Users,
  UsersRound,
} from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import type { SidebarPref } from "@/lib/sidebar-pref";
import { writeSidebarPref } from "@/lib/sidebar-pref";
import type { SessionUser, Site } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

function districtNav(): NavItem[] {
  return [
    { href: "/district", label: "Overview", icon: LayoutDashboard },
    { href: "/district/sites", label: "Schools", icon: Building2 },
    { href: "/district/years", label: "School years", icon: CalendarRange },
    { href: "/district/scales", label: "Grade scales", icon: Scale },
    { href: "/district/templates", label: "Report cards", icon: ClipboardList },
    { href: "/district/import", label: "CSV import", icon: FileUp },
  ];
}

function siteNav(siteId: string): NavItem[] {
  return [
    { href: `/sites/${siteId}`, label: "Overview", icon: LayoutDashboard },
    { href: `/sites/${siteId}/students`, label: "Students", icon: Users },
    { href: `/sites/${siteId}/staff`, label: "Staff", icon: UsersRound },
    { href: `/sites/${siteId}/courses`, label: "Courses", icon: BookOpen },
  ];
}

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/district") return false;
  const siteOverview = href.match(/^\/sites\/[^/]+$/);
  if (siteOverview) return false;
  return pathname.startsWith(`${href}/`);
}

export function AppShell({
  user,
  sites,
  sidebarPref,
  children,
}: {
  user: SessionUser;
  sites: Site[];
  sidebarPref: SidebarPref;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [pref, setPref] = useState(sidebarPref);
  const [hovering, setHovering] = useState(false);
  const siteMatch = pathname.match(/^\/sites\/([^/]+)/);
  const courseSiteHint = pathname.startsWith("/courses/")
    ? sites.find((s) => pathname.includes(s.id))
    : null;
  const currentSiteId = siteMatch?.[1] ?? courseSiteHint?.id ?? user.memberships[0]?.siteId;
  const currentSite = sites.find((s) => s.id === currentSiteId);
  const showDistrict = user.isSystemAdmin;
  const collapsed = pref.pinned ? pref.collapsed : !hovering;
  const homeHref = user.isSystemAdmin ? "/district" : currentSite ? `/sites/${currentSite.id}` : "/";

  function save(next: SidebarPref) {
    setPref(next);
    writeSidebarPref(next);
  }

  const sidebar = (mode: "rail" | "full") => (
    <SidebarBody
      collapsed={mode === "rail"}
      pinned={pref.pinned}
      showControls
      user={user}
      currentSite={currentSite}
      showDistrict={showDistrict}
      pathname={pathname}
      homeHref={homeHref}
      onToggleCollapsed={() =>
        save({
          collapsed: mode === "full",
          pinned: pref.pinned,
        })
      }
      onTogglePinned={() => {
        const nextPinned = !pref.pinned;
        save({
          pinned: nextPinned,
          collapsed: nextPinned ? mode === "rail" : true,
        });
      }}
    />
  );

  return (
    <div className="flex min-h-full bg-background">
      <aside
        className={cn(
          "hidden bg-sidebar text-sidebar-foreground md:block",
          pref.pinned
            ? collapsed
              ? "w-14 shrink-0"
              : "w-64 shrink-0"
            : cn(
                "fixed inset-y-0 left-0 z-40 shadow-lg transition-[width] duration-200",
                collapsed ? "w-14" : "w-64",
              ),
        )}
        onMouseEnter={() => {
          if (!pref.pinned) setHovering(true);
        }}
        onMouseLeave={() => {
          if (!pref.pinned) setHovering(false);
        }}
      >
        {sidebar(collapsed ? "rail" : "full")}
      </aside>
      <div className={cn("flex min-w-0 flex-1 flex-col", !pref.pinned && "md:pl-14")}>
        <header className="flex items-center gap-3 border-b border-border bg-card/80 px-4 py-2.5 backdrop-blur md:px-6">
          <Sheet>
            <SheetTrigger className="inline-flex size-8 items-center justify-center rounded-lg md:hidden">
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
              <SheetHeader className="sr-only">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <SidebarBody
                collapsed={false}
                pinned
                showControls={false}
                user={user}
                currentSite={currentSite}
                showDistrict={showDistrict}
                pathname={pathname}
                homeHref={homeHref}
              />
            </SheetContent>
          </Sheet>
          <GraduationCap className="hidden size-4 text-primary sm:block" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {currentSite?.name ?? "District office"}
            </p>
          </div>
          {user.isSystemAdmin && sites.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-7 items-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium">
                Switch school
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {sites.map((site) => (
                  <DropdownMenuItem key={site.id}>
                    <Link href={`/sites/${site.id}`} className="w-full">
                      {site.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarBody({
  collapsed,
  pinned,
  showControls,
  user,
  currentSite,
  showDistrict,
  pathname,
  homeHref,
  onToggleCollapsed,
  onTogglePinned,
}: {
  collapsed: boolean;
  pinned: boolean;
  showControls: boolean;
  user: SessionUser;
  currentSite?: Site;
  showDistrict: boolean;
  pathname: string;
  homeHref: string;
  onToggleCollapsed?: () => void;
  onTogglePinned?: () => void;
}) {
  const role = user.isSystemAdmin
    ? "System administrator"
    : user.memberships[0]?.role === "site_admin"
      ? "Site administrator"
      : "Teacher";

  return (
    <div className="flex h-full flex-col">
      <div className={cn("border-b border-sidebar-border", collapsed ? "px-2 py-3" : "px-4 py-4")}>
        <Link href={homeHref} className="block" title="Northside Unified">
          {collapsed ? (
            <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-accent font-heading text-sm text-sidebar-accent-foreground">
              N
            </span>
          ) : (
            <>
              <p className="font-heading text-lg leading-tight text-sidebar-foreground">
                Northside Unified
              </p>
              <p className="mt-0.5 text-xs text-sidebar-foreground/60">Student information</p>
            </>
          )}
        </Link>
        {showControls ? (
          <div className={cn("mt-3 flex gap-1", collapsed ? "flex-col items-center" : "justify-end")}>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-pressed={pinned}
              aria-label={pinned ? "Unpin sidebar" : "Pin sidebar"}
              title={pinned ? "Unpin sidebar" : "Pin sidebar"}
              onClick={onTogglePinned}
            >
              {pinned ? <Pin className="size-3.5" /> : <PinOff className="size-3.5" />}
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={onToggleCollapsed}
            >
              {collapsed ? <PanelLeft className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
            </Button>
          </div>
        ) : null}
      </div>
      <div className={cn("flex-1 space-y-6 overflow-y-auto py-4", collapsed ? "px-1.5" : "px-3")}>
        {showDistrict ? (
          <div>
            {collapsed ? null : (
              <p className="mb-2 px-2.5 text-[11px] font-medium tracking-wider text-sidebar-foreground/45 uppercase">
                District office
              </p>
            )}
            <nav className="flex flex-col gap-0.5">
              {districtNav().map((item) => (
                <SideLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  active={isActivePath(pathname, item.href) || pathname === item.href}
                />
              ))}
            </nav>
          </div>
        ) : null}
        {currentSite ? (
          <div>
            {collapsed ? null : (
              <p className="mb-2 px-2.5 text-[11px] font-medium tracking-wider text-sidebar-foreground/45 uppercase">
                {currentSite.name}
              </p>
            )}
            <nav className="flex flex-col gap-0.5">
              {siteNav(currentSite.id).map((item) => (
                <SideLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  active={isActivePath(pathname, item.href) || pathname === item.href}
                />
              ))}
            </nav>
          </div>
        ) : null}
      </div>
      <div className={cn("border-t border-sidebar-border", collapsed ? "p-2" : "p-3")}>
        {collapsed ? (
          <p
            className="mb-2 flex size-9 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium"
            title={`${user.fullName} · ${role}`}
          >
            {user.fullName.slice(0, 1)}
          </p>
        ) : (
          <>
            <p className="truncate px-2 text-sm text-sidebar-foreground">{user.fullName}</p>
            <p className="truncate px-2 text-xs text-sidebar-foreground/55">{role}</p>
          </>
        )}
        <form action={logoutAction} className={collapsed ? "" : "mt-2"}>
          <Button
            type="submit"
            variant="ghost"
            title="Sign out"
            aria-label="Sign out"
            className={cn(
              "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              collapsed ? "size-9 px-0" : "w-full justify-start",
            )}
          >
            <LogOut className="size-4" />
            {collapsed ? null : "Sign out"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function SideLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center rounded-lg text-sm transition-colors",
        collapsed ? "justify-center px-2 py-2" : "gap-2 px-2.5 py-2",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
    </Link>
  );
}
