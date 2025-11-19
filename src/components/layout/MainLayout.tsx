"use client";

import { ReactNode } from "react";
import { api } from "@/utils/axios.config";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Layers,
  Database,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { getUser } from '@/store/store'

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user } = getUser()
  const pathname = usePathname();

  const role = user.rolesList && user.rolesList[0] ? user.rolesList[0].toLowerCase() : null;

  const navigationItems = [
    {
      name: "Assessment Management",
      href: `/admin/admin-assessment-management`,
      icon: Layers,
      active: (pathname: string) =>
        pathname === `/admin/admin-assessment-management` ||
        pathname.startsWith(`/admin/admin-assessment-management/`),
    },
    // {
    //   name: "Question Bank",
    //   href: `/admin/questionbank`,
    //   icon: Database,
    //   active: (pathname: string) =>
    //     pathname === `/admin/questionbank` ||
    //     pathname.startsWith(`/admin/questionbank/`),
    // },
    // {
    //   name: "Analytics Dashboard",
    //   href: `/admin/analytics`,
    //   icon: Settings,
    //   active: (pathname: string) =>
    //     pathname === `/admin/analytics` ||
    //     pathname.startsWith(`/admin/analytics/`),
    // },
  ];

  const Logout = async () => {
    try {
      await api.post('/auth/logout', {});

      toast.success({
        title: "Logout Successful",
        description: "Goodbye, See you soon!",
      });

      // Clear client-side storage and redirect
      if (typeof window !== "undefined") {
        localStorage.clear();
        document.cookie =
          "secure_typeuser=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.pathname = "/";
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-16 items-center justify-between w-full px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <Image
                src="/zuvy-logo-horizontal.png"
                alt="Zuvy"
                width={104}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
            {
              role === 'admin' && (
                <nav className="flex items-center space-x-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      typeof item.active === "function"
                        ? item.active(pathname)
                        : item.active === pathname;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-2 px-4 py-2 rounded-lg text-[0.95rem] font-medium transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-gray-100"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="">{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              )
            }
          </div>

          <Button
            variant="ghost"
            className="flex hover:text-white hover:bg-red-500 items-center gap-2 "
            title="Logout"
            aria-label="Logout"
            onClick={Logout}
          >
            <span>
            Logout
            </span>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default MainLayout;
