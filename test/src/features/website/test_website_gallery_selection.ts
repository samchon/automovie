import { TestValidator } from "@nestia/e2e";

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
 */
export const test_website_gallery_selection = (): void => {
  const content = createGalleryContent();
  const { host, facts } = createGalleryHostFacts();
  const controller = new GalleryUnit.Controller(host, content.map((building) => building.images.length));
  const click = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
  controller.open(1, "middle-capture", click, () => {});
  let selected = GalleryUnit.selection(content, facts.building, facts.view);
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
  const nullable = [{ ...content[0], title: null, era: null, description: null }];
  const emptyCopy = GalleryUnit.selection(nullable, 0, 0);
  TestValidator.equals("authored empty copy retained", [emptyCopy.title, emptyCopy.era, emptyCopy.description], [null, null, null]);
};
