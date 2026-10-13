/**
 * Landing-page entry point. The static HTML owns collection content and image
 * links; mountGallery attaches its modal enhancement after that DOM exists.
 * Final page teardown releases its listeners and any open dialog. A page
 * entering the browser's back/forward cache keeps its working enhancement.
 */
import { mountGallery } from "./gallery";
import { shouldDisposeGalleryPage } from "./gallery/shouldDisposeGalleryPage";

const dispose = mountGallery(document);
window.addEventListener("pagehide", (event) => {
  if (shouldDisposeGalleryPage(event.persisted)) dispose();
});
