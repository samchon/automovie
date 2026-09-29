import { TestValidator } from "@nestia/e2e";

import { websiteGalleryFixture } from "../internal/websiteGalleryFixture";

/**
 * The browser entry point retains its enhancement through a back/forward-cache
 * transition and disposes it only when the document really leaves.
 *
 * Scenarios:
 * 1. Import the entry with an in-memory browser document and send persisted
 *    pagehide: the gallery can still open after the cached page returns.
 * 2. Send non-persisted pagehide while open: it closes, unlocks, and detaches.
 */
export const test_website_gallery_page_lifecycle = async (): Promise<void> => {
  const f = websiteGalleryFixture();
  const originals = new Map(
    ["window", "document"].map((name) => [
      name,
      Object.getOwnPropertyDescriptor(globalThis, name),
    ]),
  );
  Reflect.set(globalThis, "window", f.dom.window);
  Reflect.set(globalThis, "document", f.document);
  try {
    await import("@automovie/website/collection");
    f.dom.window.dispatchEvent(
      new f.dom.window.PageTransitionEvent("pagehide", { persisted: true }),
    );
    f.openers[0].click();
    TestValidator.predicate("cached page retains enhancement", f.dialog.open);
    f.dom.window.dispatchEvent(
      new f.dom.window.PageTransitionEvent("pagehide", { persisted: false }),
    );
    TestValidator.predicate(
      "final pagehide disposes modal",
      !f.dialog.open &&
        !f.document.documentElement.classList.contains("gallery-open"),
    );
    let intercepted = true;
    f.openers[0].addEventListener("click", (event) => {
      intercepted = event.defaultPrevented;
      event.preventDefault();
    });
    f.openers[0].click();
    TestValidator.predicate(
      "final teardown removes activation listener",
      !intercepted && !f.dialog.open,
    );
  } finally {
    for (const [name, descriptor] of originals) {
      if (descriptor === undefined) Reflect.deleteProperty(globalThis, name);
      else Object.defineProperty(globalThis, name, descriptor);
    }
    f.dom.window.close();
  }
};
