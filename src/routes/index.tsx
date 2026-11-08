import { createFileRoute, redirect } from "@tanstack/react-router";

import { BRAND, pageTitle } from "@/config/brand";

// The initial route always leads to the access screen.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: pageTitle() },
      { name: "description", content: `${BRAND.name} — ${BRAND.tagline}` },
      { property: "og:title", content: pageTitle() },
      { property: "og:description", content: BRAND.summary },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
