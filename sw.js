
const CACHE_NAME = "bangla-smart-ocr-pwa-v3";

const CORE_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", event => {

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_FILES))
      .then(() => self.skipWaiting())
  );

});

self.addEventListener("activate", event => {

  event.waitUntil((async () => {

    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key.startsWith("bangla-smart-ocr-pwa-")
          && key !== CACHE_NAME
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();

  })());

});

self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Only handle resources hosted on our own domain.
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {

    try {

      const response = await fetch(event.request);

      if (response.ok) {

        // Save successfully fetched local resources,
        // including the ONNX model.
        try {

          const cache = await caches.open(CACHE_NAME);

          await cache.put(
            event.request,
            response.clone()
          );

        } catch (cacheError) {

          console.warn(
            "Could not cache resource:",
            cacheError
          );

        }
      }

      return response;

    } catch (networkError) {

      const cached = await caches.match(
        event.request
      );

      if (cached) return cached;

      if (event.request.mode === "navigate") {

        const home = await caches.match(
          "./index.html"
        );

        if (home) return home;
      }

      return Response.error();

    }

  })());

});
