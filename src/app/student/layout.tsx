"use client";

import { usePathname } from "next/navigation";
import { getUser } from "@/store/store";
import MainLayout from "@/components/layout/MainLayout";
import UnauthorizedPage from "../_components/unauthorised";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = getUser();
  const isAssessmentPage = pathname.includes('/studentAssessment')

  const roleFromPath = pathname.split("/")[1]?.toLowerCase() || "";
  const userRole = user?.rolesList?.[0]?.toLowerCase() || "";

  if (user?.rolesList?.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  if (!(pathname.startsWith("/student") && userRole === "student")) {
    return <UnauthorizedPage />;
  }

  return <div className="font-body">
  { isAssessmentPage ? children :    <MainLayout>
    {children}
    </MainLayout>}
 
    </div>;
}
//