import { formatWhen } from "./format";
import type { ClubEvent } from "./types";

export async function notifyReminder(event: ClubEvent | undefined): Promise<void> {
  if (typeof window === "undefined") return;
  if (!event) return;
  if (!("Notification" in window)) return;

  try {
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") return;

    const title = "Cancha Fija";
    const body = `Confirmá ${event.title} · ${formatWhen(event.startsAt)}`;
    const icon = "/icon-192.png";

    if (navigator.serviceWorker?.getRegistration) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.showNotification) {
        await registration.showNotification(title, {
          body,
          icon,
          badge: icon,
          tag: `cancha-fija-${event.id}`,
          lang: "es-AR",
          data: { eventId: event.id },
        });
        return;
      }
    }

    new Notification(title, {
      body,
      icon,
      badge: icon,
      tag: `cancha-fija-${event.id}`,
      lang: "es-AR",
    });
  } catch {
    // iOS Safari, WebView without the plugin, or insecure context
  }
}
