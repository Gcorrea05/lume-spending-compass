import { useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { AuthLayout, AuthResult } from "@/components/auth/AuthLayout";
import { EMAIL_RE, TextField } from "@/components/common/Field";
import { Button } from "@/components/ui/button";
import { BRAND, pageTitle } from "@/config/brand";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: pageTitle("Recuperar senha") },
      { name: "description", content: `Prévia do fluxo de recuperação de senha do ${BRAND.name}.` },
      { property: "og:title", content: pageTitle("Recuperar senha") },
      { property: "og:description", content: "Prévia de interface. Nenhum e-mail é enviado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecoverPage,
});

function RecoverPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const err = !email.trim()
      ? "Informe um e-mail."
      : !EMAIL_RE.test(email.trim())
        ? "Use um formato de e-mail válido."
        : undefined;
    setError(err);
    if (err) return ref.current?.focus();
    setEmail("");
    setDone(true);
  };

  const back = (
    <Link
      to="/login"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Voltar para entrar
    </Link>
  );

  return (
    <AuthLayout
      title="Recuperar senha"
      description={done ? undefined : "Informe o e-mail para ver como o fluxo funcionará."}
      footer={back}
    >
      {done ? (
        <AuthResult title="Prévia do fluxo de recuperação. Nenhum e-mail foi enviado." />
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <TextField
            ref={ref}
            id="recuperar-email"
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
          <Button type="submit" size="lg" className="w-full">
            Enviar instruções
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
