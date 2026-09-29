import { mountGallery } from "@automovie/website/gallery";
import { TestValidator } from "@nestia/e2e";

import { websiteGalleryFixture } from "../internal/websiteGalleryFixture";

/**
 * A building change carries its own copy, captures and links, resets to the
 * exterior, and wraps through the collection without retaining another tour.
 *
 * Scenarios:
 * 1. Open the middle place and select a room: its content and pressed view agree.
 * 2. Advance twice and go back: both collection boundaries wrap and clear the tour.
 * 3. Close after changing place: focus returns to the original opening link.
 */
export const test_website_gallery_selection = (): void => {
  const f = websiteGalleryFixture();
  const dispose = mountGallery(f.document);
  f.openers[1].click();
  TestValidator.equals(
    "selected building copy",
    [
      f.element("#gallery-title").textContent,
      f.element("#gallery-era").textContent,
      f.element("#gallery-description").textContent,
      f.element("#gallery-count").textContent,
    ],
    ["Place 2", "Era 2", "Description 2", "2 / 3"],
  );
  TestValidator.equals(
    "selected source",
    f.element<HTMLAnchorElement>("#gallery-source").href,
    "https://example.org/source/2",
  );
  TestValidator.equals(
    "relative tour keeps mount path",
    f.element<HTMLAnchorElement>("#gallery-tour").href,
    "https://example.org/AutoMovie/manor/?view=exterior",
  );
  TestValidator.predicate(
    "tour visible and page locked",
    !f.element("#gallery-tour").hidden &&
      f.document.documentElement.classList.contains("gallery-open"),
  );
  f.element<HTMLButtonElement>("#gallery-views button:nth-child(2)").click();
  TestValidator.equals(
    "room selected",
    [
      f.element("#gallery-caption").textContent,
      f
        .element("#gallery-views button:nth-child(2)")
        .getAttribute("aria-pressed"),
    ],
    ["Room 1", "true"],
  );
  TestValidator.equals(
    "full image follows selection",
    f.element<HTMLAnchorElement>("#gallery-original").href,
    "https://example.org/AutoMovie/shots/place-2-room-1.png",
  );
  f.element<HTMLButtonElement>("#gallery-next").click();
  TestValidator.equals(
    "building change resets view",
    [
      f.element("#gallery-title").textContent,
      f.element("#gallery-caption").textContent,
    ],
    ["Place 3", "Exterior"],
  );
  TestValidator.predicate(
    "no stale tour",
    f.element("#gallery-tour").hidden &&
      !f.element("#gallery-tour").hasAttribute("href"),
  );
  f.element<HTMLButtonElement>("#gallery-next").click();
  TestValidator.equals(
    "forward boundary wraps",
    f.element("#gallery-title").textContent,
    "Place 1",
  );
  f.element<HTMLButtonElement>("#gallery-previous").click();
  TestValidator.equals(
    "backward boundary wraps",
    f.element("#gallery-title").textContent,
    "Place 3",
  );
  f.element<HTMLButtonElement>("#gallery-close").click();
  TestValidator.predicate(
    "close unlocks and restores original focus",
    !f.dialog.open &&
      !f.document.documentElement.classList.contains("gallery-open") &&
      f.document.activeElement === f.openers[1],
  );
  dispose();
  f.dom.window.close();
};
