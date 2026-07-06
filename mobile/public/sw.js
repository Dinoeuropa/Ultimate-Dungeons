const CACHE_NAME = "ultimate-dungeons-v1";

function getBasePath() {
  const path = self.location.pathname;
  if (path.endsWith("/sw.js")) {
    return path.slice(0, -"sw.js".length);
  }
  return path.endsWith("/") ? path : `${path}/`;
}

const APP_SHELL = [
  "index.html",
  "manifest.json",
  "game/index.html",
  "game/js/loader.js",
  "game/js/custom.js",
].map((entry) => `${getBasePath()}${entry}`);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok && request.url.startsWith(self.location.origin)) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    }),
  );
});
