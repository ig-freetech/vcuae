var CACHE_NAME = "ledger-web-v17";
var PRECACHE_URLS = [
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon.svg",
  "../shared/ledger-core.js",
];

function shouldCacheResponse(response) {
  return response && (response.status === 200 || response.type === "opaque");
}

function cachePut(request, response) {
  if (!shouldCacheResponse(response)) {
    return;
  }
  caches.open(CACHE_NAME).then(function (cache) {
    cache.put(request, response);
  });
}

function networkFirst(request) {
  return fetch(request)
    .then(function (response) {
      cachePut(request, response.clone());
      return response;
    })
    .catch(function () {
      return caches.match(request);
    });
}

function cacheFirst(request) {
  return caches.match(request).then(function (cached) {
    if (cached) {
      return cached;
    }
    return fetch(request).then(function (response) {
      cachePut(request, response.clone());
      return response;
    });
  });
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_URLS);
    }),
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") {
    return;
  }

  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  var path = url.pathname;
  var isAppShell =
    /\/web\/?$/.test(path) ||
    path.endsWith("/web/index.html") ||
    path.endsWith("/web/app.js");

  event.respondWith(isAppShell ? networkFirst(event.request) : cacheFirst(event.request));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.map(function (name) {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        }),
      );
    }),
  );
});
