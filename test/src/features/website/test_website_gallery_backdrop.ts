import { TestValidator } from "@nestia/e2e";

import { GalleryUnit } from "../internal/GalleryUnit";
import { createGalleryHostFacts } from "../internal/createGalleryHostFacts";

/**
 * Exercises gallery dismissal policy at the supplied rectangle edges and descendant-control boundary.
 *
 * Scenarios:
 * 1. Interior and exact rectangle edges retain opening/lock while descendant-control clicks do not dismiss.
 * 2. Each authored outside direction closes and restores the original opener through supplied policy callbacks; disposal requests content release.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the directly imported real controller through existing GalleryUnit aliases and checks open/lock/focus effects after actual policy decisions.
 * @evidence contracts/testing.md#independent-expectations Authored 20/420/30/330 edges and independently selected one-pixel-outside points judge strict boundary behavior, with original opener identity retained.
 * @evidence contracts/testing.md#distinguishing-cases Interior/exact edges contrast all four outside directions and a descendant click, followed by close/disposal effects without assuming browser layout.
 * @evidence contracts/testing.md#execution-ownership The named entry reuses the existing caller-owned logical host facts, releases the controller and starts no DOM/modal/browser or new mock driver.
 */
export function test_website_gallery_backdrop(): void {
  const { facts, host }: ReturnType<typeof createGalleryHostFacts> = createGalleryHostFacts();
  const controller: import("../../../../website/src/gallery/GalleryController").GalleryController<string> = new GalleryUnit.Controller(host, [3, 1]);
  const click: { button: number; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean; } = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
  let interceptions: number = 0;
  TestValidator.predicate("real policy admits arranged opening", controller.open(0, "original-opener", click, (): void => { interceptions++; }));
  TestValidator.equals("opening owns lock and interception", [facts.open, facts.locked, interceptions], [true, true, 1]);
  const bounds: { left: number; right: number; top: number; bottom: number; } = { left: 20, right: 420, top: 30, bottom: 330 };
  for (const [x, y] of [[200, 100], [20, 100], [420, 100], [200, 30], [200, 330]]) {
    controller.backdrop({ dialogTarget: true, x, y, bounds });
    TestValidator.equals("inside or edge stays open", [facts.open, facts.locked], [true, true]);
  }
  controller.moveBuilding(1);
  controller.backdrop({ dialogTarget: false, x: 500, y: 500, bounds });
  TestValidator.predicate("descendant control does not dismiss", facts.open);
  for (const [x, y] of [[19, 100], [421, 100], [200, 29], [200, 331]]) {
    controller.open(0, "original-opener", click, (): void => { interceptions++; });
    controller.backdrop({ dialogTarget: true, x, y, bounds });
    TestValidator.equals("outside restores owned state", [facts.open, facts.locked, facts.focused], [false, false, "original-opener"]);
  }
  controller.dispose();
  TestValidator.equals("teardown requests content release", facts.effects.at(-1), "dispose");
}
