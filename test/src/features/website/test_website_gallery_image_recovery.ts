import { TestValidator } from "@nestia/e2e";

import { GalleryImageLifecycle } from "../../../../website/src/gallery/GalleryImageLifecycle";
import { deriveGallerySelection } from "../../../../website/src/gallery/deriveGallerySelection";
import { createGalleryContent } from "../internal/createGalleryContent";

/**
 * Image replacement transfers failure authority and attempts the prior binding's release once. A late error cannot replace the current picture; direct capture URLs remain authored data. Native error text and rendering require browser observation.
 *
 * Scenarios:
 * 1. Attach an exterior: its current failure is admitted and its direct URL retained.
 * 2. Replace with a room then exterior: each old failure is refused and binding released.
 * 3. Dispose twice: all pending failures are invalidated and release occurs once.
 * 4. A throwing release loses old callback authority before execution and is not retried.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real image lifecycle with owned attachment callbacks and asserts admitted effects, released callback indices and retained cleanup failures; an old guard acting during release or a repeated release fails the counts.
 * @evidence contracts/testing.md#independent-expectations Replacement transfers authority before old cleanup and each installed callback is released once; expected indices follow the explicit attachment sequence, with failure identity supplied independently by the test.
 * @evidence contracts/testing.md#distinguishing-cases Covers current and stale image errors, successive exterior/room replacement, repeated successful disposal and failed transfer/disposal; actual image decoding and DOM removal remain browser observations.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit imports GalleryImageLifecycle directly and supplies portable callbacks without a DOM, browser, foreign replacement or asset acquisition.
 */
export function test_website_gallery_image_recovery(): void {
  const lifecycle: GalleryImageLifecycle = new GalleryImageLifecycle();
  const guards: ((effect: () => void) => void)[] = [];
  const released: number[] = [];
  let picture: string = "image";
  const attach: (whenCurrent: (effect: () => void) => void) => () => void = (
    whenCurrent: (effect: () => void) => void,
  ): (() => void) => {
    const index: number = guards.push(whenCurrent) - 1;
    picture = "image";
    return (): void => {
      released.push(index);
    };
  };
  const content: ReturnType<typeof createGalleryContent> =
    createGalleryContent();
  lifecycle.replace(attach);
  guards[0]((): void => {
    picture = "failure";
  });
  TestValidator.equals(
    "failed exterior retains direct capture",
    [picture, deriveGallerySelection(content, 0, 0).image.src],
    ["failure", "https://example.org/AutoMovie/shots/place-1.png"],
  );
  lifecycle.replace(attach);
  guards[0]((): void => {
    picture = "old-exterior-failure";
  });
  TestValidator.equals(
    "room replacement releases exterior",
    [picture, released],
    ["image", [0]],
  );
  TestValidator.equals(
    "room is authored replacement",
    deriveGallerySelection(content, 0, 1).image.alt,
    "Place 1 room 1",
  );
  lifecycle.replace(attach);
  guards[1]((): void => {
    picture = "old-room-failure";
  });
  TestValidator.equals(
    "late room error cannot replace current picture",
    [picture, released],
    ["image", [0, 1]],
  );
  let currentEffects: number = 0;
  guards[2]((): void => {
    currentEffects++;
  });
  TestValidator.equals(
    "current replacement retains authority",
    currentEffects,
    1,
  );
  lifecycle.dispose();
  lifecycle.dispose();
  for (const guard of guards)
    guard((): void => {
      currentEffects++;
    });
  TestValidator.equals(
    "disposal invalidates callbacks and releases once",
    [currentEffects, released],
    [1, [0, 1, 2]],
  );
  const failing: GalleryImageLifecycle = new GalleryImageLifecycle();
  const releaseFailure: Error = new Error("Image listener release failed.");
  let oldGuard: (effect: () => void) => void = (): void => {};
  let failedReleases: number = 0;
  let retiredEffects: number = 0;
  failing.replace((guard: (effect: () => void) => void): (() => void) => {
    oldGuard = guard;
    return (): void => {
      failedReleases++;
      oldGuard((): void => {
        retiredEffects++;
      });
      throw releaseFailure;
    };
  });
  const attachments: number = guards.length;
  let reported: unknown;
  try {
    failing.replace(attach);
  } catch (error) {
    reported = error;
  }
  TestValidator.predicate(
    "transfer reports original release failure",
    reported === releaseFailure,
  );
  TestValidator.equals(
    "failed transfer retires authority before release and admits no replacement",
    [failedReleases, retiredEffects, guards.length],
    [1, 0, attachments],
  );
  for (const attempt of [0, 1]) {
    reported = null;
    try {
      failing.dispose();
    } catch (error) {
      reported = error;
    }
    TestValidator.predicate(
      `failed disposal receipt ${attempt}`,
      reported === releaseFailure,
    );
  }
  oldGuard((): void => {
    retiredEffects++;
  });
  TestValidator.equals(
    "failed release is never retried and old guard stays retired",
    [failedReleases, retiredEffects],
    [1, 0],
  );
}
