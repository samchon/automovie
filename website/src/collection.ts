/**
 * Landing-page entry point. The static HTML owns collection content and image links; mountGallery attaches its modal enhancement after that DOM exists. Final page teardown requests listener/dialog cleanup; failure remains observable through the native event callback. A page entering the browser's back/forward cache retains its enhancement.
 */
import { mountGallery } from "./gallery";
import { shouldDisposeGalleryPage } from "./gallery/shouldDisposeGalleryPage";

const dispose: () => void = mountGallery(document);
window.addEventListener("pagehide", (event: PageTransitionEvent): void => {
  if (shouldDisposeGalleryPage(event.persisted)) dispose();
});
