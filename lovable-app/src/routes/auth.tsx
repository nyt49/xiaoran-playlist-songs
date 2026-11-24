import { createFileRoute, redirect } from "@tanstack/react-router";

// Keep the old login link working; GitHub Token login now lives directly in /admin.
export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
});
