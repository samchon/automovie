import { mountGallery } from "@automovie/website/gallery";
import { TestValidator } from "@nestia/e2e";

import { websiteGalleryFixture } from "../internal/websiteGalleryFixture";

/**
 * A building's primary tour link remains ordinary navigation while its separate
 * capture link opens the gallery using the article's preview image.
 * Scenarios:
 * 1. A primary 3D link is not intercepted by the capture enhancement.
 * 2. The secondary link needs no nested image and still presents the exterior.
 */
export const test_website_gallery_secondary_link = (): void => {
  const f = websiteGalleryFixture(1, 1),
    primary = f.openers[0]!;
  primary.removeAttribute("data-gallery");
  primary.href = "tour/?building=ancient";
  const capture = f.document.createElement("a");
  capture.setAttribute("data-gallery", "");
  capture.href = "shots/place-1.png";
  primary.parentElement!.append(capture);
  const dispose = mountGallery(f.document);
  let intercepted = true;
  primary.addEventListener("click", (event) => {
    intercepted = event.defaultPrevented;
    event.preventDefault();
  });
  primary.click();
  TestValidator.predicate(
    "primary stays direct navigation",
    !intercepted && !f.dialog.open,
  );
  capture.click();
  TestValidator.predicate("capture opens gallery", f.dialog.open);
  TestValidator.equals(
    "article preview is the exterior",
    f.element<HTMLImageElement>("#gallery-picture img").src,
    "https://example.org/AutoMovie/shots/place-1.png",
  );
  dispose();
  f.dom.window.close();
};
