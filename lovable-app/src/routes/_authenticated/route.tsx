import { createFileRoute, Outlet } from "@tanstack/react-router";

// The admin page performs its own GitHub Token verification before showing any controls.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: () => <Outlet />,
});
