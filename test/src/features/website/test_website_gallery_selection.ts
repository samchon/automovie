import { TestValidator } from "@nestia/e2e";
import type { GalleryController } from "../../../../website/src/gallery/GalleryController";

import { GalleryUnit } from "../internal/GalleryUnit";
import { createGalleryContent } from "../internal/createGalleryContent";
import { createGalleryHostFacts } from "../internal/createGalleryHostFacts";

/**
 * Building selection retains its authored copy and resolved destinations while
 * resetting the view, and closure retains the original opener as focus owner.
 *
 * Scenarios:
 * 1. Open the middle building and select a room: copy, image and pressed index agree.
 * 2. Advance across both collection boundaries: exterior resets and absent tour clears.
 * 3. Close after navigation: lock releases and the original opener receives focus.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls gallery selection and controller navigation to observe current copy, source/tour destinations, pressed view, collection wrap and original opener restoration; stale destinations, unreset views or last-building focus fail.
 * @evidence contracts/testing.md#independent-expectations Three authored content records independently supply copy and links; the expected count, room index and boundary wraps follow collection/index arithmetic, while an owned host records requested lock/focus effects without claiming native completion.
 * @evidence contracts/testing.md#distinguishing-cases Covers opening the middle building, a room view, movement to an absent-tour building, both collection wraps, close after navigation and nullable copy; modified-click refusal, keyboard view wraps and disposal belong to separate gallery units.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_website_gallery_selection entry owns pure projection and controller cases through the existing host fixture, with no DOM, browser process, image decoder or native dialog.
 */
export function test_website_gallery_selection(): void {
  const content: ReturnType<typeof createGalleryContent> = createGalleryContent();
  const { host, facts }: ReturnType<typeof createGalleryHostFacts> = createGalleryHostFacts();
  const controller: GalleryController<string> = new GalleryUnit.Controller(host, content.map((building: ReturnType<typeof createGalleryContent>[number]): number => building.images.length));
  const click: Parameters<GalleryController<string>["open"]>[2] = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
  controller.open(1, "middle-capture", click, (): void => {});
  let selected: ReturnType<typeof GalleryUnit.selection> = GalleryUnit.selection(content, facts.building, facts.view);
  TestValidator.equals("selected building copy", [selected.title, selected.era, selected.description, selected.count], ["Place 2", "Era 2", "Description 2", "2 / 3"]);
  TestValidator.equals("selected destinations", [selected.source, selected.tour], ["https://example.org/source/2", "https://example.org/AutoMovie/manor/?view=exterior"]);
  TestValidator.predicate("opening locks page", facts.open && facts.locked);
  controller.selectView(1);
  selected = GalleryUnit.selection(content, facts.building, facts.view);
  TestValidator.equals("room selection", [selected.caption, selected.pressed, selected.image.src], ["Room 1", [false, true, false], "https://example.org/AutoMovie/shots/place-2-room-1.png"]);
  controller.moveBuilding(1);
  selected = GalleryUnit.selection(content, facts.building, facts.view);
  TestValidator.equals("building resets exterior and clears tour", [selected.title, selected.caption, selected.tour, selected.pressed], ["Place 3", "Exterior", null, [true, false, false]]);
  controller.moveBuilding(1);
  TestValidator.equals("forward collection wrap", facts.building, 0);
  controller.moveBuilding(-1);
  TestValidator.equals("backward collection wrap", facts.building, 2);
  controller.close();
  TestValidator.equals("original opener restored", [facts.open, facts.locked, facts.focused], [false, false, "middle-capture"]);
  controller.dispose();
  const nullable: ReturnType<typeof createGalleryContent> = [{ ...content[0], title: null, era: null, description: null }];
  const emptyCopy: ReturnType<typeof GalleryUnit.selection> = GalleryUnit.selection(nullable, 0, 0);
  TestValidator.equals("authored empty copy retained", [emptyCopy.title, emptyCopy.era, emptyCopy.description], [null, null, null]);
}
