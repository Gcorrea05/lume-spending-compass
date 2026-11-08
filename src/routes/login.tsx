import { useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Compass } from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { EMAIL_RE, PasswordField, TextField } from "@/components/common/Field";
import { Button } from "@/components/ui/button";
import { BRAND, pageTitle } from "@/config/brand";
import { useDemoSession } from "@/state/demo-session";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: pageTitle("Entrar") },
      { name: "description", content: `Acesse o protótipo do ${BRAND.name}. ${BRAND.tagline}` },
      { property: "og:title", content: pageTitle("Entrar") },
      { property: "og:description", content: `Protótipo de interface do ${BRAND.name}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

interface Errors {
  email?: string;
  password?: string;
}

function LoginPage() {
  const navigate = useNavigate();
  const { enter } = useDemoSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const goToDemo = () => {
    setPassword("");
    enter();
    navigate({ to: "/dashboard" });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!email.trim()) next.email = "Informe um e-mail.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Use um formato de e-mail válido.";
    if (!password) next.password = "Informe a senha.";
    setErrors(next);
    if (next.email) return emailRef.current?.focus();
    if (next.password) return passwordRef.current?.focus();
    goToDemo();
  };

  return (
    <AuthLayout
      title="Bem-vindo de volta"
      description="Entre para ver o painel de demonstração."
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Ainda não tem conta?</p>
          <Button asChild variant="outline">
            <Link to="/criar-conta">Criar conta</Link>
          </Button>
        </div>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <TextField
          ref={emailRef}
          id="login-email"
          label="E-mail"
          type="email"
          inputMode="email"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="voce@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <PasswordField
          ref={passwordRef}
          id="login-senha"
          label="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          labelAside={
            <Link
              to="/recuperar-senha"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Esqueci minha senha
            </Link>
          }
        />
        <Button type="submit" size="lg" className="w-full">
          Entrar
          <ArrowRight />
        </Button>
      </form>

      <div className="mt-4 flex justify-center">
        <Button type="button" variant="ghost" size="sm" onClick={goToDemo}>
          <Compass />
          Explorar demonstração
        </Button>
      </div>
    </AuthLayout>
  );
}
