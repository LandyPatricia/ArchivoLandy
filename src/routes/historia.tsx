import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/historia")({
  beforeLoad: () => {
    throw redirect({ to: "/mensajeras" });
  },
});
