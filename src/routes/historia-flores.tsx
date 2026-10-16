import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/historia-flores")({
  beforeLoad: () => {
    throw redirect({ to: "/la-flor-mas-bella" });
  },
});
