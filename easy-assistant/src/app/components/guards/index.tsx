import { ReactNode } from "react";
import { cn } from "../../components/ui/utils";
import { useAuth } from "../../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <>{children}</>;
}

export interface LoadingFallbackProps {
  message?: string;
}

export function LoadingFallback({ message }: LoadingFallbackProps) {
  return (
    <div
      className={cn("flex items-center justify-center min-h-[400px]", "bg-gray-50 rounded-lg")}
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-4">
        <div className={cn("w-8 h-8 border-4 border-blue-600", "border-t-transparent rounded-full", "animate-spin")} />
        {message && <p className="text-sm text-gray-500">{message}</p>}
      </div>
    </div>
  );
}

export const PROTECTED_ROUTES: string[] = [
  "/dashboard",
  "/appointments",
  "/conversations",
  "/staff",
  "/services",
  "/availability",
  "/channels",
  "/marketing",
  "/ai-settings",
  "/billing",
  "/analytics",
  "/support",
  "/settings",
];