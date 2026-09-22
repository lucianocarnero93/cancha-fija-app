# Cancha Fija

App PWA para organizar fútbol amateur (5, 8, 9 y 11): asistencia, pizarra táctica, chat y cuerpo técnico.

## Roles

- **DT** y **Ayudante de Campo**: mismos permisos de edición
- **Jugador**: ver, confirmar o rechazar asistencia

El menú de prueba de arriba cambia de rol. Los datos viven en `localStorage`.

## Desarrollo

```bash
npm install
npm run dev
```

Build de producción:

```bash
npm run build
```

## PWA (PWABuilder)

`public/manifest.json` cubre los miembros que pide PWABuilder:

| Miembro | Qué hace acá |
|---|---|
| Service worker `public/sw.js` | Offline, intercepta GET, push, background sync, periodic sync |
| `screenshots` | Capturas narrow (1080×1920) y wide (1280×720) |
| `prefer_related_applications` | `false`: se instala esta web app, no una nativa |
| `related_applications` | Array vacío (no hay ficha de store todavía) |
| `iarc_rating_id` | UUID de ejemplo de PWABuilder. Reemplazalo por el certificado real de [IARC](https://www.globalratings.com/) |
| `display_override` | `window-controls-overlay` → `tabbed` → `standalone` |
| `scope_extensions` | Array vacío (un solo origen) |
| `launch_handler` | Reusa la instancia abierta (`focus-existing`) |
| `shortcuts` | Inicio, Agenda, Cancha, Chat, Equipo |
| `file_handlers` | Abre `.json` / `.cancha.json` del plantel |
| `share_target` | Recibe texto/URL en el chat (`GET /chat`) |
| `widgets` | Widget Adaptive Card “Próximo partido” (Windows) |
| `protocol_handlers` | `web+canchafija://` abre la app |
| `tab_strip` | Modo con pestañas en desktop |

También: `display: standalone`, `orientation: portrait`, recordatorios con `Notification`, viewport sin pellizco y `touch-action: manipulation`.
