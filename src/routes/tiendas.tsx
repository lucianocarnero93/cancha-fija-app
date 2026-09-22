import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/tiendas")({ component: TiendasPage });

function TiendasPage() {
  return (
    <main className="px-4 py-5">
      <p className="text-sm text-muted">Publicación</p>
      <h1 className="text-2xl font-semibold">Play Store y App Store</h1>
      <p className="mt-2 text-sm text-muted">
        La app ya es una PWA instalable. Para las tiendas se empaqueta esa misma web.
      </p>
      <section className="mt-4 space-y-3 rounded-xl bg-surface p-4 text-sm shadow-card">
        <p className="font-semibold">Listo en la app</p>
        <ul className="list-disc space-y-1 pl-5 text-muted">
          <li>Manifiesto, iconos, capturas y orientación vertical.</li>
          <li>Permiso de GPS explicado antes de pedirlo.</li>
          <li>Política de privacidad.</li>
          <li>Modo standalone, sin mapa embebido.</li>
        </ul>
      </section>
      <section className="mt-4 space-y-3 rounded-xl bg-surface p-4 text-sm shadow-card">
        <p className="font-semibold">Google Play</p>
        <p className="text-muted">
          Con PWABuilder se genera un Android Trusted Web Activity. Ahí se carga la ficha, la
          clasificación IARC y el enlace a esta privacidad. El paquete se sube a Play Console.
        </p>
      </section>
      <section className="mt-4 space-y-3 rounded-xl bg-surface p-4 text-sm shadow-card">
        <p className="font-semibold">App Store</p>
        <p className="text-muted">
          En iPhone se instala desde Safari (Agregar a inicio). Para la App Store hace falta un envoltorio
          nativo (PWABuilder / Xcode) y las frases de uso de ubicación: “Para marcar la cancha del partido
          y abrir Mapas”.
        </p>
      </section>
      <Link to="/privacidad" className="mt-6 flex h-12 items-center font-semibold text-accent">
        Ver privacidad
      </Link>
    </main>
  );
}
