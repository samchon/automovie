import { mountGallery } from "@automovie/website/gallery";
import { TestValidator } from "@nestia/e2e";

import { websiteGalleryFixture } from "../internal/websiteGalleryFixture";

/**
 * Only a click beyond the dialog's bounds dismisses it. Padding, boundary
 * points and descendant controls continue to belong to the modal.
 *
 * Scenarios:
 * 1. Click interior and each exact edge: the gallery stays open.
 * 2. Click one pixel past each edge: the gallery closes and returns focus.
 */
export const test_website_gallery_backdrop = (): void => {
  const f = websiteGalleryFixture();
  const dispose = mountGallery(f.document);
  f.openers[0].click();
  for (const [clientX, clientY] of [
    [200, 100],
    [20, 100],
    [420, 100],
    [200, 30],
    [200, 330],
  ]) {
    f.dialog.dispatchEvent(
      new f.dom.window.MouseEvent("click", { clientX, clientY, bubbles: true }),
    );
    TestValidator.predicate(
      "inside or on the boundary stays open",
      f.dialog.open,
    );
  }
  f.element<HTMLButtonElement>("#gallery-next").click();
  TestValidator.predicate("descendant control does not dismiss", f.dialog.open);
  for (const [clientX, clientY] of [
    [19, 100],
    [421, 100],
    [200, 29],
    [200, 331],
  ]) {
    f.openers[0].click();
    f.dialog.dispatchEvent(
      new f.dom.window.MouseEvent("click", { clientX, clientY, bubbles: true }),
    );
    TestValidator.predicate(
      "outside dismisses",
      !f.dialog.open && f.document.activeElement === f.openers[0],
    );
  }
  dispose();
  f.dom.window.close();
};
