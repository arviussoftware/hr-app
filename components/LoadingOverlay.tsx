"use client";

import { useLoading } from "@/context/LoadingContext";
import RouteLoader from "./loader";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoadingOverlay() {
  const { loading, setLoading } = useLoading();
  const pathname = usePathname();

  // Local loading state to simulate route loading
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    // When pathname changes, show loader for a brief moment
    setRouteLoading(true);

    const timer = setTimeout(() => {
      setRouteLoading(false);
      setLoading(false);  // Also update global loading to false on route change end
    }, 500); // adjust delay as needed

    return () => clearTimeout(timer);
  }, [pathname, setLoading]);

  if (!loading && !routeLoading) return null;

  return <RouteLoader loading message="Loading..." />;
}
