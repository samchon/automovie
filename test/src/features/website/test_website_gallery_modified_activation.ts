import { mountGallery } from "@automovie/website/gallery";
import { TestValidator } from "@nestia/e2e";

import { websiteGalleryFixture } from "../internal/websiteGalleryFixture";

/**
 * The enhancement intercepts ordinary activation only, preserving new-tab,
 * download and alternate-button behavior of the original image links.
 *
 * Scenarios:
 * 1. Activate with each modifier and the middle button: the link is unhandled.
 * 2. Activate normally: the event is consumed and the modal opens.
 */
export const test_website_gallery_modified_activation = (): void => {
  const f = websiteGalleryFixture();
  const dispose = mountGallery(f.document);
  let intercepted = false;
  f.openers[2].addEventListener("click", (event) => {
    intercepted = event.defaultPrevented;
    event.preventDefault(); // Suppress JSDOM's unimplemented navigation boundary.
  });
  for (const options of [
    { button: 1 },
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { altKey: true },
  ]) {
    f.openers[2].dispatchEvent(
      new f.dom.window.MouseEvent("click", {
        ...options,
        bubbles: true,
        cancelable: true,
      }),
    );
    TestValidator.predicate(
      "alternate activation keeps its destination",
      !intercepted && !f.dialog.open,
    );
  }
  f.openers[2].click();
  TestValidator.predicate(
    "ordinary activation opens modal",
    intercepted && f.dialog.open,
  );
  dispose();
  f.dom.window.close();
};
