import { TestValidator } from "@nestia/e2e";

import { GalleryUnit } from "../internal/GalleryUnit";
import { createGalleryContent } from "../internal/createGalleryContent";

/**
 * Image replacement transfers failure authority and releases the prior binding.
 * A late error cannot replace the current picture; direct capture URLs remain
 * authored data. Native error text and rendering are actual browser observations.
 *
 * Scenarios:
 * 1. Attach an exterior: its current failure is admitted and its direct URL retained.
 * 2. Replace with a room then exterior: each old failure is refused and binding released.
 * 3. Dispose twice: all pending failures are invalidated and release occurs once.
 */
export const test_website_gallery_image_recovery = (): void => {
  const lifecycle = new GalleryUnit.ImageLifecycle();
  const guards: ((effect: () => void) => void)[] = [];
  const released: number[] = [];
  let picture = "image";
  const attach = (whenCurrent: (effect: () => void) => void) => {
    const index = guards.push(whenCurrent) - 1;
    picture = "image";
    return () => { released.push(index); };
  };
  const content = createGalleryContent();
  lifecycle.replace(attach);
  guards[0](() => { picture = "failure"; });
  TestValidator.equals("failed exterior retains direct capture", [picture, GalleryUnit.selection(content, 0, 0).image.src], ["failure", "https://example.org/AutoMovie/shots/place-1.png"]);
  lifecycle.replace(attach);
  guards[0](() => { picture = "old-exterior-failure"; });
  TestValidator.equals("room replacement releases exterior", [picture, released], ["image", [0]]);
  TestValidator.equals("room is authored replacement", GalleryUnit.selection(content, 0, 1).image.alt, "Place 1 room 1");
  lifecycle.replace(attach);
  guards[1](() => { picture = "old-room-failure"; });
  TestValidator.equals("late room error cannot replace current picture", [picture, released], ["image", [0, 1]]);
  let currentEffects = 0;
  guards[2](() => { currentEffects++; });
  TestValidator.equals("current replacement retains authority", currentEffects, 1);
  lifecycle.dispose();
  lifecycle.dispose();
  for (const guard of guards) guard(() => { currentEffects++; });
  TestValidator.equals("disposal invalidates callbacks and releases once", [currentEffects, released], [1, [0, 1, 2]]);
};
