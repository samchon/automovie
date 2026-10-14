import { TestValidator } from "@nestia/e2e";

import { GalleryUnit } from "../internal/GalleryUnit";
import { createGalleryHostFacts } from "../internal/createGalleryHostFacts";

/**
 * Exercises admission of only unmodified primary gallery clicks.
 *
 * Scenarios:
 * 1. Every modifier and nonprimary button refuse without effects or interception.
 * 2. The neighboring plain primary click admits once and requests open/lock before disposal.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the directly imported real controller through the existing alias, observing alternate refusal, untouched effects and one adjacent admitted opening.
 * @evidence contracts/testing.md#independent-expectations Authored modifier/button variants and independently stated zero/one interception and lock/open effects define expectations.
 * @evidence contracts/testing.md#distinguishing-cases Each modifier and nonprimary button contrasts a plain primary click so an always-admit or always-refuse policy fails without observing real browser navigation.
 * @evidence contracts/testing.md#execution-ownership The named entry owns existing logical host facts and controller lifecycle, disposes it and creates no DOM/modal/native host or new driver.
 */
export function test_website_gallery_modified_activation(): void {
  const { host, facts }: ReturnType<typeof createGalleryHostFacts> = createGalleryHostFacts();
  const controller: import("../../../../website/src/gallery/GalleryController").GalleryController<string> = new GalleryUnit.Controller(host, [3]);
  const click: { button: number; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean; } = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
  let intercepted: number = 0;
  for (const patch of [{ button: 1 }, { button: 2 }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }])
    TestValidator.equals("alternate activation stays native", controller.open(0, "capture", { ...click, ...patch }, (): void => { intercepted++; }), false);
  TestValidator.equals("refused inputs have no effects", [intercepted, facts.effects], [0, []]);
  TestValidator.equals("plain activation admits", controller.open(0, "capture", click, (): void => { intercepted++; }), true);
  TestValidator.equals("plain activation opens and locks", [intercepted, facts.open, facts.locked], [1, true, true]);
  controller.dispose();
}
