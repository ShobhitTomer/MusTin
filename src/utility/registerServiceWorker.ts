// This utility script handles service worker registration and messaging

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/serviceWorker.js")
        .then((registration) => {
          console.log(
            "ServiceWorker registration successful with scope: ",
            registration.scope
          );
        })
        .catch((error) => {
          console.log("ServiceWorker registration failed: ", error);
        });
    });
  }
}

// Cache specific resources using the service worker
export function cacheResources(urls: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      // Set up a one-time message listener for the success response
      const messageHandler = (event: MessageEvent) => {
        if (event.data && event.data.type === "SONGS_CACHED") {
          navigator.serviceWorker.removeEventListener(
            "message",
            messageHandler
          );
          resolve(event.data.success);
        }
      };

      navigator.serviceWorker.addEventListener("message", messageHandler);

      // Send the URLs to be cached
      navigator.serviceWorker.controller.postMessage({
        type: "CACHE_SONGS",
        songUrls: urls,
      });

      // Resolve after a timeout even if no message received
      setTimeout(() => {
        navigator.serviceWorker.removeEventListener("message", messageHandler);
        resolve(false);
      }, 5000);
    } else {
      resolve(false);
    }
  });
}
