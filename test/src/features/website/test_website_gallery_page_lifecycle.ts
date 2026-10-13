import { TestValidator } from "@nestia/e2e";

import { GalleryUnit } from "../internal/GalleryUnit";
import { createGalleryHostFacts } from "../internal/createGalleryHostFacts";

/**
 * Persisted pagehide preserves the enhancement for BFcache restoration; a final
 * pagehide disposes it. The collection's actual callback consumes this policy.
 *
 * Scenarios:
 * 1. Persisted pagehide keeps an opening and subsequent view navigation.
 * 2. Final pagehide disposes, unlocks and prevents subsequent activation.
 */
export const test_website_gallery_page_lifecycle = (): void => {
  const { host, facts } = createGalleryHostFacts();
  const controller = new GalleryUnit.Controller(host, [3]);
  const click = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
  controller.open(0, "capture", click, () => {});
  TestValidator.equals("BFcache keeps enhancement", GalleryUnit.shouldDisposePage(true), false);
  if (GalleryUnit.shouldDisposePage(true)) controller.dispose();
  controller.selectView(1);
  TestValidator.equals("restored page remains interactive", [facts.open, facts.locked, facts.view], [true, true, 1]);
  TestValidator.equals("final pagehide releases enhancement", GalleryUnit.shouldDisposePage(false), true);
  if (GalleryUnit.shouldDisposePage(false)) controller.dispose();
  TestValidator.equals("final page releases opening", [facts.open, facts.locked, facts.focused], [false, false, "capture"]);
  TestValidator.equals("final page cannot reopen", controller.open(0, "capture", click, () => {}), false);
};
