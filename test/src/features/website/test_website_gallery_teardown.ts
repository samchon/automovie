import { TestValidator } from "@nestia/e2e";
import type { GalleryController } from "../../../../website/src/gallery/GalleryController";

import { GalleryUnit } from "../internal/GalleryUnit";
import { createGalleryHostFacts } from "../internal/createGalleryHostFacts";

/**
 * Disposal releases an opening once and invalidates its policy callbacks.
 * A never-opened gallery releases contents without inventing an opener focus.
 *
 * Scenarios:
 * 1. Dispose an opening: lock and original focus restore, every late action is inert.
 * 2. Dispose before opening: existing focus remains and contents still release.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls disposal and every retained controller action, observing unlock, original focus, refused open/key admission and unchanged effect count/selection; repeated effects or revived authority after disposal fail.
 * @evidence contracts/testing.md#independent-expectations The authored opener and selected room determine saved state, and a pre-action effect count provides the no-new-effects oracle; host facts observe requested cleanup rather than native listener or dialog release.
 * @evidence contracts/testing.md#distinguishing-cases Covers disposal while open, repeated disposal, late close/navigation/backdrop/open/key calls and never-opened disposal with existing focus; native cleanup failures and current-open reconciliation have separate owners.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_website_gallery_teardown entry owns portable controller lifetime cases through the existing host fixture, without replacing DOM methods or starting a browser; no native cleanup success follows from callback returns.
 */
export function test_website_gallery_teardown(): void {
  const { host, facts }: ReturnType<typeof createGalleryHostFacts> = createGalleryHostFacts();
  const controller: GalleryController<string> = new GalleryUnit.Controller(host, [3, 2]);
  const click: Parameters<GalleryController<string>["open"]>[2] = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
  controller.open(0, "original", click, (): void => {});
  controller.selectView(1);
  controller.dispose();
  TestValidator.equals("opening disposed", [facts.open, facts.locked, facts.focused], [false, false, "original"]);
  const before: number = facts.effects.length;
  let intercepted: boolean = false;
  controller.dispose();
  controller.close();
  controller.closed();
  controller.moveBuilding(1);
  controller.selectView(2);
  controller.backdrop({ dialogTarget: true, x: -1, y: -1, bounds: { left: 0, right: 1, top: 0, bottom: 1 } });
  TestValidator.equals("late open refused", controller.open(1, "late", click, (): void => { intercepted = true; }), false);
  TestValidator.equals("late key refused", controller.key({ ...click, key: "ArrowRight" }, (): void => { intercepted = true; }), false);
  TestValidator.equals("late actions produce no state effects", [facts.effects.length, intercepted, facts.building, facts.view], [before, false, 0, 1]);
  const unopened: ReturnType<typeof createGalleryHostFacts> = createGalleryHostFacts();
  unopened.facts.focused = "existing-page-focus";
  new GalleryUnit.Controller(unopened.host, [1]).dispose();
  TestValidator.equals("unopened disposal preserves focus", [unopened.facts.focused, unopened.facts.effects.at(-1)], ["existing-page-focus", "dispose"]);
}
