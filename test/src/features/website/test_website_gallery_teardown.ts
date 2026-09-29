import { mountGallery } from "@automovie/website/gallery";
import { TestValidator } from "@nestia/e2e";

import { websiteGalleryFixture } from "../internal/websiteGalleryFixture";

/**
 * Disposal releases both open and unopened enhancements. Their original
 * links survive, and former controls cannot mutate the gallery afterward.
 *
 * Scenarios:
 * 1. Dispose an open gallery twice: it unlocks the document and restores focus.
 * 2. Activate the former link and controls: no modal or content update occurs.
 * 3. Dispose before opening: the document's existing focus stays unchanged.
 */
export const test_website_gallery_teardown = (): void => {
  const f = websiteGalleryFixture();
  const dispose = mountGallery(f.document);
  f.openers[0].click();
  const oldView = f.element<HTMLButtonElement>(
    "#gallery-views button:nth-child(2)",
  );
  const oldImage = f.element<HTMLImageElement>("#gallery-picture img");
  dispose();
  dispose();
  TestValidator.predicate(
    "disposal closes and restores focus",
    !f.dialog.open &&
      !f.document.documentElement.classList.contains("gallery-open") &&
      f.document.activeElement === f.openers[0],
  );
  let intercepted = true;
  f.openers[1].addEventListener("click", (event) => {
    intercepted = event.defaultPrevented;
    event.preventDefault();
  });
  f.openers[1].click();
  f.element<HTMLButtonElement>("#gallery-next").click();
  f.dialog.dispatchEvent(
    new f.dom.window.KeyboardEvent("keydown", { key: "ArrowRight" }),
  );
  oldView.click();
  oldImage.dispatchEvent(new f.dom.window.Event("error"));
  TestValidator.predicate(
    "disposed link preserves its default",
    !intercepted && !f.dialog.open,
  );
  TestValidator.equals(
    "disposed controls cannot mutate",
    f.element("#gallery-title").textContent,
    "Place 1",
  );
  TestValidator.predicate(
    "dynamic listeners also detach",
    f.element("#gallery-picture img") === oldImage &&
      f.element("#gallery-caption").textContent === "Exterior",
  );
  f.dom.window.close();
  const unopened = websiteGalleryFixture();
  unopened.openers[1].focus();
  mountGallery(unopened.document)();
  TestValidator.predicate(
    "unopened teardown preserves focus",
    unopened.document.activeElement === unopened.openers[1],
  );
  unopened.dom.window.close();
};
