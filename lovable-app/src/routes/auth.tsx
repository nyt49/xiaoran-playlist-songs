import { createFileRoute, Navigate } from "@tanstack/react-router";

// Keep the old login URL working by sending visitors to the GitHub Token login page.
export const Route = createFileRoute("/auth")({
  component: () => <Navigate to="/admin" replace />,
});
