import { mountGallery } from "@automovie/website/gallery";
import { TestValidator } from "@nestia/e2e";

import { websiteGalleryFixture } from "../internal/websiteGalleryFixture";

/**
 * Arrow keys cycle the current building's images, with browser shortcuts and
 * unrelated keys retaining their default behavior.
 *
 * Scenarios:
 * 1. Move right through two rooms and wrap; move left across the other boundary.
 * 2. Send Tab and each modified arrow: neither view nor default action changes.
 */
export const test_website_gallery_keyboard = (): void => {
  const f = websiteGalleryFixture();
  const dispose = mountGallery(f.document);
  f.openers[0].click();
  for (const [key, expected] of [
    ["ArrowRight", "Room 1"],
    ["ArrowRight", "Room 2"],
    ["ArrowRight", "Exterior"],
    ["ArrowLeft", "Room 2"],
    ["ArrowLeft", "Room 1"],
  ]) {
    const event = new f.dom.window.KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
    });
    f.dialog.dispatchEvent(event);
    TestValidator.equals(
      "arrow selects the adjacent view",
      f.element("#gallery-caption").textContent,
      expected,
    );
    TestValidator.predicate(
      "handled arrow suppresses page scroll",
      event.defaultPrevented,
    );
  }
  for (const options of [
    { key: "Tab" },
    { key: "ArrowRight", ctrlKey: true },
    { key: "ArrowRight", metaKey: true },
    { key: "ArrowRight", altKey: true },
    { key: "ArrowRight", shiftKey: true },
  ]) {
    const event = new f.dom.window.KeyboardEvent("keydown", {
      ...options,
      bubbles: true,
      cancelable: true,
    });
    f.dialog.dispatchEvent(event);
    TestValidator.equals(
      "shortcut leaves view unchanged",
      f.element("#gallery-caption").textContent,
      "Room 1",
    );
    TestValidator.predicate(
      "shortcut retains default",
      !event.defaultPrevented,
    );
  }
  dispose();
  f.dom.window.close();
};
