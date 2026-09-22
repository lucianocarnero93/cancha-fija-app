import { useState, type FormEvent } from "react";
import { authClient, signIn } from "@/lib/auth/client";
import { LogoMark } from "./logo";

// Pantalla de entrada.
// El registro con mail no abre Google ni X, así se puede probar en el emulador.
export function SignInPanel({ opening = false }: { opening?: boolean }) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitAccount(event: FormEvent) {
    event.preventDefault();
    setErrorText("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes("@")) {
      setErrorText("El mail no parece válido.");
      return;
    }
    if (password.length < 8) {
      setErrorText("La contraseña necesita al menos 8 caracteres.");
      return;
    }
    if (mode === "register" && fullName.trim().length < 2) {
      setErrorText("Poné tu nombre para crear la cuenta.");
      return;
    }

    setBusy(true);
    const result =
      mode === "register"
        ? await authClient.signUp.email({
            name: fullName.trim(),
            email: cleanEmail,
            password,
            callbackURL: "/",
          })
        : await authClient.signIn.email({
            email: cleanEmail,
            password,
            callbackURL: "/",
          });
    setBusy(false);

    if (result.error) {
      setErrorText(accountError(result.error.message ?? "", mode));
    }
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center px-6 py-10">
      <LogoMark className="size-16" />
      <h1 className="mt-5 text-3xl font-semibold">Mi Vestuario</h1>
      {opening ? (
        <p className="mt-2 text-sm text-muted">Abriendo el vestuario…</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">
            Creá una cuenta con tu mail. No hace falta Google ni X, y en el emulador no te devuelve al
            inicio.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={mode === "register" ? tabOn : tabOff}
              onClick={() => {
                setMode("register");
                setErrorText("");
              }}
            >
              Registrate
            </button>
            <button
              type="button"
              className={mode === "login" ? tabOn : tabOff}
              onClick={() => {
                setMode("login");
                setErrorText("");
              }}
            >
              Ya tengo cuenta
            </button>
          </div>

          <form className="mt-4 space-y-3" onSubmit={(event) => void submitAccount(event)}>
            {mode === "register" ? (
              <label className="block text-sm">
                Nombre
                <input
                  className={field}
                  value={fullName}
                  autoComplete="name"
                  onChange={(event) => setFullName(event.target.value)}
                />
              </label>
            ) : null}
            <label className="block text-sm">
              Mail
              <input
                className={field}
                type="email"
                value={email}
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="block text-sm">
              Contraseña
              <input
                className={field}
                type="password"
                value={password}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {errorText ? <p className="text-sm text-danger">{errorText}</p> : null}
            <button type="submit" className="h-14 w-full rounded-lg bg-accent text-base font-semibold text-accent-fg" disabled={busy}>
              {busy ? "Un momento…" : mode === "register" ? "Crear cuenta" : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-xs text-muted">O, si el emulador lo permite:</p>
          <button
            type="button"
            className="mt-2 h-12 w-full rounded-lg text-sm font-semibold text-muted"
            onClick={() => signIn("grok-google", { callbackURL: "/" })}
          >
            Continuar con Google
          </button>
          <button
            type="button"
            className="h-12 w-full rounded-lg text-sm font-semibold text-muted"
            onClick={() => signIn("grok-x", { callbackURL: "/" })}
          >
            Continuar con X
          </button>
        </>
      )}
    </main>
  );
}

const field =
  "mt-1 flex h-12 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
const tabOn = "h-11 rounded-lg bg-accent text-sm font-semibold text-accent-fg";
const tabOff = "h-11 rounded-lg bg-surface text-sm font-semibold text-muted";

function accountError(message: string, mode: "register" | "login"): string {
  const text = message.toLowerCase();
  if (text.includes("already") || text.includes("exist")) {
    return "Ese mail ya tiene cuenta. Entrá con la contraseña.";
  }
  if (text.includes("password") || text.includes("short")) {
    return "La contraseña necesita al menos 8 caracteres.";
  }
  if (text.includes("invalid email")) return "El mail no parece válido.";
  if (mode === "login") return "Mail o contraseña incorrectos.";
  return "No se pudo crear la cuenta. Probá de nuevo.";
}
