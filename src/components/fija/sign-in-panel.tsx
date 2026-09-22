import { signIn } from "@/lib/auth/client";
import { LogoMark } from "./logo";

export function SignInPanel({ opening = false }: { opening?: boolean }) {
  return (
    <main className="flex min-h-dvh flex-col justify-center px-6 py-10">
      <LogoMark className="size-16" />
      <h1 className="mt-5 text-3xl font-semibold">Mi Vestuario</h1>
      {opening ? (
        <p className="mt-2 text-sm text-muted">Abriendo el vestuario…</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">
            Entrá con tu cuenta de Google. Así cada jugador usa la app con su nombre, no con un equipo de
            prueba.
          </p>
          <button
            type="button"
            className="mt-8 h-14 w-full rounded-lg bg-accent text-base font-semibold text-accent-fg"
            onClick={() => signIn("grok-google", { callbackURL: "/" })}
          >
            Continuar con Google
          </button>
          <button
            type="button"
            className="mt-2 h-12 w-full rounded-lg text-sm font-semibold text-muted"
            onClick={() => signIn("grok-x", { callbackURL: "/" })}
          >
            Continuar con X
          </button>
          <p className="mt-6 text-xs text-muted">
            Apple no está disponible. En el celular de un cliente, Google es la puerta de entrada.
          </p>
        </>
      )}
    </main>
  );
}
