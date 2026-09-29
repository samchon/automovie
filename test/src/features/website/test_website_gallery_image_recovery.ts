import { mountGallery } from "@automovie/website/gallery";
import { TestValidator } from "@nestia/e2e";

import { websiteGalleryFixture } from "../internal/websiteGalleryFixture";

/**
 * A failed capture names the recovery path; changing view restores an image.
 * A late failure from a replaced capture cannot remove the current picture.
 *
 * Scenarios:
 * 1. Fail the visible exterior: show a readable failure and retain its full URL.
 * 2. Select a room, replace it, then fail the old image: the new image survives.
 */
export const test_website_gallery_image_recovery = (): void => {
  const f = websiteGalleryFixture();
  const dispose = mountGallery(f.document);
  f.openers[0].click();
  f.element("#gallery-picture img").dispatchEvent(
    new f.dom.window.Event("error"),
  );
  TestValidator.predicate(
    "failure supplies a recovery instruction",
    f.element("#gallery-picture").textContent!.includes("Open full image"),
  );
  TestValidator.equals(
    "failed image keeps direct URL",
    f.element<HTMLAnchorElement>("#gallery-original").href,
    "https://example.org/AutoMovie/shots/place-1.png",
  );
  f.element<HTMLButtonElement>("#gallery-views button:nth-child(2)").click();
  const old = f.element<HTMLImageElement>("#gallery-picture img");
  TestValidator.equals("new view restores an image", old.alt, "Place 1 room 1");
  f.element<HTMLButtonElement>("#gallery-views button:nth-child(1)").click();
  const current = f.element<HTMLImageElement>("#gallery-picture img");
  old.dispatchEvent(new f.dom.window.Event("error"));
  TestValidator.predicate(
    "late failure cannot replace current image",
    f.element("#gallery-picture img") === current,
  );
  dispose();
  f.dom.window.close();
};
