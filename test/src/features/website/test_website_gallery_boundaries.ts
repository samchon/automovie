import { mountGallery } from "@automovie/website/gallery";
import { TestValidator } from "@nestia/e2e";

import { websiteGalleryFixture } from "../internal/websiteGalleryFixture";

/**
 * Missing markup fails before attachment, and an unsupported native modal
 * retains static links. A single capture is a valid wrapping gallery.
 *
 * Scenarios:
 * 1. Remove required markup or all buildings: mounting reports its precondition.
 * 2. Omit native showModal: mounting and disposal leave the static link intact.
 * 3. Use one building with no interior: both building and image directions wrap.
 */
export const test_website_gallery_boundaries = (): void => {
  for (const selector of ["#gallery", ".building h3"]) {
    const f = websiteGalleryFixture();
    f.element(selector).remove();
    let message = "";
    try {
      mountGallery(f.document);
    } catch (error) {
      message = (error as Error).message;
    }
    TestValidator.predicate(
      "missing authored markup refuses attachment",
      message.includes("Missing gallery element"),
    );
    f.dom.window.close();
  }
  const empty = websiteGalleryFixture(0);
  let message = "";
  try {
    mountGallery(empty.document);
  } catch (error) {
    message = (error as Error).message;
  }
  TestValidator.equals(
    "empty collection refuses attachment",
    message,
    "The gallery needs a building.",
  );
  empty.dom.window.close();
  const unsupported = websiteGalleryFixture();
  Reflect.deleteProperty(unsupported.dialog, "showModal");
  const fallbackDispose = mountGallery(unsupported.document);
  let intercepted = true;
  unsupported.openers[0].addEventListener("click", (event) => {
    intercepted = event.defaultPrevented;
    event.preventDefault();
  });
  unsupported.openers[0].click();
  TestValidator.predicate(
    "unsupported modal keeps static navigation",
    !intercepted && !unsupported.dialog.open,
  );
  fallbackDispose();
  unsupported.dom.window.close();
  const single = websiteGalleryFixture(1, 0);
  const dispose = mountGallery(single.document);
  single.openers[0].click();
  for (const selector of ["#gallery-next", "#gallery-previous"])
    single.element<HTMLButtonElement>(selector).click();
  for (const key of ["ArrowLeft", "ArrowRight"])
    single.dialog.dispatchEvent(
      new single.dom.window.KeyboardEvent("keydown", { key, bubbles: true }),
    );
  TestValidator.equals(
    "singleton navigation remains exterior",
    [
      single.element("#gallery-title").textContent,
      single.element("#gallery-caption").textContent,
      single.element("#gallery-count").textContent,
    ],
    ["Place 1", "Exterior", "1 / 1"],
  );
  dispose();
  single.dom.window.close();
};
