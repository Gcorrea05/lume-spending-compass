import { useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthLayout, AuthResult } from "@/components/auth/AuthLayout";
import { EMAIL_RE, PasswordField, TextField } from "@/components/common/Field";
import { Button } from "@/components/ui/button";
import { BRAND, pageTitle } from "@/config/brand";

export const Route = createFileRoute("/criar-conta")({
  head: () => ({
    meta: [
      { title: pageTitle("Criar conta") },
      { name: "description", content: `Tela demonstrativa de criação de conta do ${BRAND.name}.` },
      { property: "og:title", content: pageTitle("Criar conta") },
      { property: "og:description", content: "Interface demonstrativa. Nenhuma conta é criada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreateAccountPage,
});

type Field = "name" | "email" | "password" | "confirm";

function CreateAccountPage() {
  const [values, setValues] = useState<Record<Field, string>>({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [done, setDone] = useState(false);
  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    confirm: useRef<HTMLInputElement>(null),
  };

  const set = (f: Field) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [f]: e.target.value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<Field, string>> = {};
    if (!values.name.trim()) next.name = "Informe seu nome.";
    if (!values.email.trim()) next.email = "Informe um e-mail.";
    else if (!EMAIL_RE.test(values.email.trim())) next.email = "Use um formato de e-mail válido.";
    if (!values.password) next.password = "Informe uma senha.";
    if (!values.confirm) next.confirm = "Confirme a senha.";
    else if (values.password && values.confirm !== values.password)
      next.confirm = "As senhas não coincidem.";
    setErrors(next);
    const first = (["name", "email", "password", "confirm"] as Field[]).find((f) => next[f]);
    if (first) return refs[first].current?.focus();
    setValues({ name: "", email: "", password: "", confirm: "" });
    setDone(true);
  };

  return (
    <AuthLayout
      title="Criar conta"
      description={done ? undefined : "Preencha os campos para conhecer o fluxo."}
      footer={
        !done && (
          <p className="text-sm text-muted-foreground">
            Já tenho conta —{" "}
            <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Entrar
            </Link>
          </p>
        )
      }
    >
      {done ? (
        <div className="space-y-5">
          <AuthResult title="Demonstração concluída. Nenhuma conta foi criada.">
            Os dados digitados foram descartados.
          </AuthResult>
          <Button asChild size="lg" className="w-full">
            <Link to="/login">Voltar para entrar</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <TextField ref={refs.name} id="conta-nome" label="Nome" autoComplete="off" value={values.name} onChange={set("name")} error={errors.name} />
          <TextField
            ref={refs.email}
            id="conta-email"
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="voce@exemplo.com"
            value={values.email}
            onChange={set("email")}
            error={errors.email}
          />
          <PasswordField ref={refs.password} id="conta-senha" label="Senha" value={values.password} onChange={set("password")} error={errors.password} />
          <PasswordField ref={refs.confirm} id="conta-confirmar" label="Confirmar senha" value={values.confirm} onChange={set("confirm")} error={errors.confirm} />
          <Button type="submit" size="lg" className="w-full">
            Criar conta
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
