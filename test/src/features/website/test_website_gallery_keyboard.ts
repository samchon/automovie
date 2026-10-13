import { TestValidator } from "@nestia/e2e";

import { GalleryUnit } from "../internal/GalleryUnit";
import { createGalleryHostFacts } from "../internal/createGalleryHostFacts";

/**
 * Plain arrows wrap the current building's views. Native keys and modified
 * arrows retain their browser meaning without interception or selection change.
 *
 * Scenarios:
 * 1. Three forward steps and two backward steps traverse both view boundaries.
 * 2. Tab, Escape, other keys and every modifier retain the last selection.
 */
export const test_website_gallery_keyboard = (): void => {
  const { host, facts } = createGalleryHostFacts();
  const controller = new GalleryUnit.Controller(host, [3]);
  const click = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
  controller.open(0, "capture", click, () => {});
  let intercepted = 0;
  for (const expected of [1, 2, 0]) {
    TestValidator.equals("forward arrow consumed", controller.key({ ...click, key: "ArrowRight" }, () => { intercepted++; }), true);
    TestValidator.equals("forward view", facts.view, expected);
  }
  for (const expected of [2, 1]) {
    controller.key({ ...click, key: "ArrowLeft" }, () => { intercepted++; });
    TestValidator.equals("backward view", facts.view, expected);
  }
  for (const patch of [{ key: "Tab" }, { key: "Escape" }, { key: "Enter" }, { key: "ArrowRight", ctrlKey: true }, { key: "ArrowLeft", metaKey: true }, { key: "ArrowRight", shiftKey: true }, { key: "ArrowLeft", altKey: true }])
    TestValidator.equals("native key retained", controller.key({ ...click, ...patch }, () => { intercepted++; }), false);
  TestValidator.equals("only arrows changed selection", [facts.view, intercepted], [1, 5]);
  controller.dispose();
};
