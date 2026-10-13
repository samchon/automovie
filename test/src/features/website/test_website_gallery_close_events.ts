import { TestValidator } from "@nestia/e2e";

import { GalleryUnit } from "../internal/GalleryUnit";
import { createGalleryHostFacts } from "../internal/createGalleryHostFacts";

/**
 * Close completion observes current open state. An older delivered notification
 * cannot release a newer opening; actual native closure releases current focus.
 *
 * Scenarios:
 * 1. Close, reopen, then deliver the old notification: the new lock remains.
 * 2. Observe native Escape closure and duplicate notification: current opener restores.
 * 3. Dispose an open gallery: closure and release are synchronous and idempotent.
 */
export const test_website_gallery_close_events = (): void => {
  const { host, facts } = createGalleryHostFacts();
  const controller = new GalleryUnit.Controller(host, [3, 3]);
  const click = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
  controller.open(0, "first", click, () => {});
  controller.close();
  TestValidator.equals("explicit close completed", [facts.open, facts.locked, facts.focused], [false, false, "first"]);
  controller.open(1, "second", click, () => {});
  const before = facts.effects.length;
  controller.closed();
  TestValidator.equals("delayed old event causes no effects", facts.effects.length, before);
  TestValidator.equals("reopening stays locked", [facts.open, facts.locked, facts.focused], [true, true, "first"]);
  facts.open = false;
  controller.closed();
  TestValidator.equals("actual native closure restores current opener", [facts.locked, facts.focused], [false, "second"]);
  controller.closed();
  TestValidator.equals("duplicate completion preserves released state", [facts.locked, facts.focused], [false, "second"]);
  controller.open(0, "third", click, () => {});
  controller.dispose();
  TestValidator.equals("disposal completes closure synchronously", [facts.open, facts.locked, facts.focused, facts.effects.at(-1)], [false, false, "third", "dispose"]);
  const completed = facts.effects.length;
  controller.closed();
  controller.dispose();
  TestValidator.equals("late completion and repeated disposal are inert", facts.effects.length, completed);
};
