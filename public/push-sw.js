/* Service worker for band schedule push reminders. */
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "သတိပေးချက်", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "ရွှေဇင်မောင် တီးဝိုင်း";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "/icons/app-icon-192.png",
      badge: "/icons/app-icon-192.png",
      tag: payload.tag || undefined,
      data: { url: payload.url || "/dashboard" },
      silent: payload.silent === true,
      vibrate: [200, 100, 200],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
