"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { ToastContainer } from "react-toastify";
import RouteLoader from "@/components/loader";

interface LayoutClientProps {
  children: React.ReactNode;
  loading?: boolean; 
  message?: string;  
}

export function LayoutClient({ children, loading = false, message }: LayoutClientProps) {
  const pathname = usePathname();

  const hideNav = ["/", "/login", "/post-logout", "forgot-password"].includes(pathname);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <RouteLoader loading={loading} message={message || "Loading..."} />

      {!hideNav && <Navigation />}
      {children}
    </>
  );
}