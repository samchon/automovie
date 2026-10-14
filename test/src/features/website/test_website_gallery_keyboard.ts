import { TestValidator } from "@nestia/e2e";

import { GalleryUnit } from "../internal/GalleryUnit";
import { createGalleryHostFacts } from "../internal/createGalleryHostFacts";

/**
 * Exercises unmodified arrow selection policy without intercepting other or modified keys.
 *
 * Scenarios:
 * 1. Unmodified forward/backward arrows wrap the authored three-view population with five interceptions.
 * 2. Tab, Escape, Enter and each modifier remain unhandled without additional selection/interception, followed by controller disposal.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the directly imported real gallery controller through the existing alias and observes view wrap plus interception counts.
 * @evidence contracts/testing.md#independent-expectations Authored forward/backward index sequences and a separately counted five interceptions define expectations independently of the controller.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts both wrap directions, Tab/Escape/Enter and each modifier; refusal proves no policy interception, not native key delivery or browser focus handling.
 * @evidence contracts/testing.md#execution-ownership The named entry reuses existing logical host callbacks, disposes the controller and starts no DOM, native modal or new host/driver.
 */
export function test_website_gallery_keyboard(): void {
  const { host, facts }: ReturnType<typeof createGalleryHostFacts> = createGalleryHostFacts();
  const controller: import("../../../../website/src/gallery/GalleryController").GalleryController<string> = new GalleryUnit.Controller(host, [3]);
  const click: { button: number; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean; } = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
  controller.open(0, "capture", click, (): void => {});
  let intercepted: number = 0;
  for (const expected of [1, 2, 0]) {
    TestValidator.equals("forward arrow consumed", controller.key({ ...click, key: "ArrowRight" }, (): void => { intercepted++; }), true);
    TestValidator.equals("forward view", facts.view, expected);
  }
  for (const expected of [2, 1]) {
    controller.key({ ...click, key: "ArrowLeft" }, (): void => { intercepted++; });
    TestValidator.equals("backward view", facts.view, expected);
  }
  for (const patch of [{ key: "Tab" }, { key: "Escape" }, { key: "Enter" }, { key: "ArrowRight", ctrlKey: true }, { key: "ArrowLeft", metaKey: true }, { key: "ArrowRight", shiftKey: true }, { key: "ArrowLeft", altKey: true }])
    TestValidator.equals("native key retained", controller.key({ ...click, ...patch }, (): void => { intercepted++; }), false);
  TestValidator.equals("only arrows changed selection", [facts.view, intercepted], [1, 5]);
  controller.dispose();
}
