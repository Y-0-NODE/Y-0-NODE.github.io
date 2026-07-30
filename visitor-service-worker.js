const CACHE_NAME = "yunhe-visitor-pwa-v1";
const PROJECT_BASE = "/YUNHENODE.github.io/";
const ROOT_SCOPE = new URL(self.registration.scope).pathname === "/";
const START_PAGE = ROOT_SCOPE ? "/" : `${PROJECT_BASE}visitor.html?visitor=1`;
const APP_SHELL = [
  START_PAGE,
  `${PROJECT_BASE}visitor.html`,
  `${PROJECT_BASE}style.css`,
  `${PROJECT_BASE}assets/styles/pages/visitor.css`,
  `${PROJECT_BASE}assets/styles/components/edge-drawer.css`,
  `${PROJECT_BASE}scripts/core/config.js`,
  `${PROJECT_BASE}scripts/core/utils.js`,
  `${PROJECT_BASE}scripts/components/edge-drawer.js`,
  `${PROJECT_BASE}scripts/pages/visitor.js`,
  `${PROJECT_BASE}scripts/pages/visitor-audio-player.js`,
  `${PROJECT_BASE}scripts/pages/visitor-pwa.js`,
  ROOT_SCOPE ? "/visitor.webmanifest" : `${PROJECT_BASE}visitor.webmanifest`,
  ROOT_SCOPE ? "/visitor-icon-192.png" : `${PROJECT_BASE}visitor-icon-192.png`,
  ROOT_SCOPE ? "/visitor-icon-512.png" : `${PROJECT_BASE}visitor-icon-512.png`
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(APP_SHELL.map(url => cache.add(new Request(url, { cache: "reload" }))))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys.filter(key => key.startsWith("yunhe-visitor-pwa-") && key !== CACHE_NAME).map(key =>
            caches.delete(key)
          )
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy)));
          }
          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ||
            (await caches.match(START_PAGE)) ||
            new Response(
              '<!doctype html><meta charset="utf-8"><title>云鹤系统</title><style>body{font-family:sans-serif;padding:12vw;background:#f4f3ee;color:#18201b}</style><h1>云鹤系统</h1><p>当前网络不可用，请稍后重新打开。</p>',
              { headers: { "Content-Type": "text/html; charset=utf-8" } }
            )
          );
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const update = fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy)));
          }
          return response;
        })
        .catch(() => cached);
      return cached || update;
    })
  );
});
