import { TestValidator } from "@nestia/e2e";

import { GalleryUnit } from "../internal/GalleryUnit";
import { createGalleryHostFacts } from "../internal/createGalleryHostFacts";

/**
 * Disposal releases an opening once and invalidates its policy callbacks.
 * A never-opened gallery releases contents without inventing an opener focus.
 *
 * Scenarios:
 * 1. Dispose an opening: lock and original focus restore, every late action is inert.
 * 2. Dispose before opening: existing focus remains and contents still release.
 */
export const test_website_gallery_teardown = (): void => {
  const { host, facts } = createGalleryHostFacts();
  const controller = new GalleryUnit.Controller(host, [3, 2]);
  const click = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
  controller.open(0, "original", click, () => {});
  controller.selectView(1);
  controller.dispose();
  TestValidator.equals("opening disposed", [facts.open, facts.locked, facts.focused], [false, false, "original"]);
  const before = facts.effects.length;
  let intercepted = false;
  controller.dispose();
  controller.close();
  controller.closed();
  controller.moveBuilding(1);
  controller.selectView(2);
  controller.backdrop({ dialogTarget: true, x: -1, y: -1, bounds: { left: 0, right: 1, top: 0, bottom: 1 } });
  TestValidator.equals("late open refused", controller.open(1, "late", click, () => { intercepted = true; }), false);
  TestValidator.equals("late key refused", controller.key({ ...click, key: "ArrowRight" }, () => { intercepted = true; }), false);
  TestValidator.equals("late actions produce no state effects", [facts.effects.length, intercepted, facts.building, facts.view], [before, false, 0, 1]);
  const unopened = createGalleryHostFacts();
  unopened.facts.focused = "existing-page-focus";
  new GalleryUnit.Controller(unopened.host, [1]).dispose();
  TestValidator.equals("unopened disposal preserves focus", [unopened.facts.focused, unopened.facts.effects.at(-1)], ["existing-page-focus", "dispose"]);
};
