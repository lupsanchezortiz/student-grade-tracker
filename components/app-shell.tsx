"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Scale,
  Users,
  UsersRound,
} from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
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
  children,
}: {
  user: SessionUser;
  sites: Site[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const siteMatch = pathname.match(/^\/sites\/([^/]+)/);
  const courseSiteHint = pathname.startsWith("/courses/")
    ? sites.find((s) => pathname.includes(s.id))
    : null;
  const currentSiteId = siteMatch?.[1] ?? courseSiteHint?.id ?? user.memberships[0]?.siteId;
  const currentSite = sites.find((s) => s.id === currentSiteId);
  const showDistrict = user.isSystemAdmin;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-4 py-4">
        <Link href={user.isSystemAdmin ? "/district" : currentSite ? `/sites/${currentSite.id}` : "/"} className="block">
          <p className="font-heading text-lg leading-tight text-sidebar-foreground">
            Northside Unified
          </p>
          <p className="mt-0.5 text-xs text-sidebar-foreground/60">Student information</p>
        </Link>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {showDistrict ? (
          <div>
            <p className="mb-2 px-2.5 text-[11px] font-medium tracking-wider text-sidebar-foreground/45 uppercase">
              District office
            </p>
            <nav className="flex flex-col gap-0.5">
              {districtNav().map((item) => (
                <SideLink key={item.href} item={item} active={isActivePath(pathname, item.href) || pathname === item.href} />
              ))}
            </nav>
          </div>
        ) : null}
        {currentSite ? (
          <div>
            <p className="mb-2 px-2.5 text-[11px] font-medium tracking-wider text-sidebar-foreground/45 uppercase">
              {currentSite.name}
            </p>
            <nav className="flex flex-col gap-0.5">
              {siteNav(currentSite.id).map((item) => (
                <SideLink
                  key={item.href}
                  item={item}
                  active={isActivePath(pathname, item.href) || pathname === item.href}
                />
              ))}
            </nav>
          </div>
        ) : null}
      </div>
      <div className="border-t border-sidebar-border p-3">
        <p className="truncate px-2 text-sm text-sidebar-foreground">{user.fullName}</p>
        <p className="truncate px-2 text-xs text-sidebar-foreground/55">
          {user.isSystemAdmin ? "System administrator" : user.memberships[0]?.role === "site_admin" ? "Site administrator" : "Teacher"}
        </p>
        <form action={logoutAction} className="mt-2">
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-full bg-background">
      <aside className="hidden w-64 shrink-0 bg-sidebar text-sidebar-foreground md:block">
        {sidebar}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card/80 px-4 py-2.5 backdrop-blur md:px-6">
          <Sheet>
            <SheetTrigger className="inline-flex size-8 items-center justify-center rounded-lg md:hidden">
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
              <SheetHeader className="sr-only">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              {sidebar}
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

function SideLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}
