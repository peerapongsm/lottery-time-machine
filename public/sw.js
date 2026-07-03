// Service worker for หวยจำลอง (static export, served under basePath).
//
// CRITICAL: never cache-first HTML navigations. This app is hash-chunked
// (Next static export writes new /_next/ filenames per build); a stale
// cached HTML page can reference JS/CSS chunks that no longer exist,
// breaking the app until the cache is manually cleared. HTML navigations
// are therefore always network-first, with the cached shell only as an
// offline fallback.
const CACHE_NAME = "ltm-v1x";

// Resolves to the app's root ("<basePath>/"), which doubles as the offline
// navigation fallback. Derived from this script's own URL so it works
// whatever basePath the site is deployed under.
const SHELL_URL = new URL("./", self.location.href).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(SHELL_URL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Cross-origin requests (e.g. Umami analytics) are never intercepted, so
  // analytics keeps working regardless of SW/cache state.
  if (url.origin !== self.location.origin) return;

  // HTML navigations: network-first, cache the fresh response, fall back to
  // the cached shell only when the network is unavailable.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(SHELL_URL))),
    );
    return;
  }

  // Hashed build assets: cache-first — the filename changes whenever the
  // content does, so a cache hit is always correct.
  if (url.pathname.includes("/_next/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
    return;
  }

  // Draw/series JSON: stale-while-revalidate runtime cache. NEVER precached
  // at install — only populated as pages actually fetch it.
  if (url.pathname.includes("/data/") && url.pathname.endsWith(".json")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  // Everything else (icons, manifest, favicon, ...): default network
  // behavior, no interception.
});
