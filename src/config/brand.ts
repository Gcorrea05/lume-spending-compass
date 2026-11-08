/**
 * Provisional working name. Change it here to rename the product everywhere
 * (browser titles, logo, access screens). Not a registered trademark.
 */
export const BRAND = {
  name: "Lume",
  tagline: "Seu mês, mais claro.",
  summary: "Registre seus gastos e consulte cada período com clareza.",
  prototypeNotice: "Protótipo de interface. Use dados fictícios.",
} as const;

export const pageTitle = (page?: string) => (page ? `${page} · ${BRAND.name}` : BRAND.name);
