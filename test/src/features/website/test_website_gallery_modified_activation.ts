import { TestValidator } from "@nestia/e2e";

import { GalleryUnit } from "../internal/GalleryUnit";
import { createGalleryHostFacts } from "../internal/createGalleryHostFacts";

/**
 * Only an unmodified primary click admits the enhancement; native alternate
 * activation remains unintercepted and cannot change selection or lock state.
 *
 * Scenarios:
 * 1. Each modifier and non-primary button refuses with no effect.
 * 2. An adjacent plain click intercepts once and opens the selected building.
 */
export const test_website_gallery_modified_activation = (): void => {
  const { host, facts } = createGalleryHostFacts();
  const controller = new GalleryUnit.Controller(host, [3]);
  const click = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
  let intercepted = 0;
  for (const patch of [{ button: 1 }, { button: 2 }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }])
    TestValidator.equals("alternate activation stays native", controller.open(0, "capture", { ...click, ...patch }, () => { intercepted++; }), false);
  TestValidator.equals("refused inputs have no effects", [intercepted, facts.effects], [0, []]);
  TestValidator.equals("plain activation admits", controller.open(0, "capture", click, () => { intercepted++; }), true);
  TestValidator.equals("plain activation opens and locks", [intercepted, facts.open, facts.locked], [1, true, true]);
  controller.dispose();
};
