import { TestValidator } from "@nestia/e2e";

import { GalleryUnit } from "../internal/GalleryUnit";
import { createGalleryHostFacts } from "../internal/createGalleryHostFacts";

/**
 * Dialog-target coordinates strictly outside native observed bounds request a
 * close; exact edges and descendant controls remain inside. Owned host facts
 * prove policy and focus/lock effects without changing any native DOM method.
 *
 * Scenarios:
 * 1. Interior and all exact edges preserve the current open state.
 * 2. A descendant click remains a control even at an outside coordinate.
 * 3. Each one-pixel-outside point closes, unlocks and restores its opener.
 */
export const test_website_gallery_backdrop = (): void => {
  const { facts, host } = createGalleryHostFacts();
  const controller = new GalleryUnit.Controller(host, [3, 1]);
  const click = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
  let interceptions = 0;
  TestValidator.predicate("real policy admits arranged opening", controller.open(0, "original-opener", click, () => { interceptions++; }));
  TestValidator.equals("opening owns lock and interception", [facts.open, facts.locked, interceptions], [true, true, 1]);
  const bounds = { left: 20, right: 420, top: 30, bottom: 330 };
  for (const [x, y] of [[200, 100], [20, 100], [420, 100], [200, 30], [200, 330]]) {
    controller.backdrop({ dialogTarget: true, x, y, bounds });
    TestValidator.equals("inside or edge stays open", [facts.open, facts.locked], [true, true]);
  }
  controller.moveBuilding(1);
  controller.backdrop({ dialogTarget: false, x: 500, y: 500, bounds });
  TestValidator.predicate("descendant control does not dismiss", facts.open);
  for (const [x, y] of [[19, 100], [421, 100], [200, 29], [200, 331]]) {
    controller.open(0, "original-opener", click, () => { interceptions++; });
    controller.backdrop({ dialogTarget: true, x, y, bounds });
    TestValidator.equals("outside restores owned state", [facts.open, facts.locked, facts.focused], [false, false, "original-opener"]);
  }
  controller.dispose();
  TestValidator.equals("teardown requests content release", facts.effects.at(-1), "dispose");
};
