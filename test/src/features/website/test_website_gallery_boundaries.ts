import { TestValidator } from "@nestia/e2e";

import { GalleryUnit } from "../internal/GalleryUnit";
import { createGalleryHostFacts } from "../internal/createGalleryHostFacts";
import { throwsError } from "../internal/predicates";

/**
 * Authored markup and native capability govern enhancement admission. Selection
 * owns wrapping and close notifications without recreating a DOM or replacing
 * its modal/layout methods.
 *
 * Scenarios:
 * 1. Missing markup and an empty supported collection refuse before effects;
 *    unsupported modal keeps ordinary link behavior and has no teardown effect.
 * 2. Singleton and multi-view navigation wrap, and a building change resets
 *    exterior; modified clicks/keys are never intercepted.
 * 3. A delayed close while currently open leaves the new lock/focus intact;
 *    an actual close and disposal release their own state and listeners.
 */
export const test_website_gallery_boundaries = (): void => {
  for (const selector of ["#gallery", "h3"])
    TestValidator.predicate("missing markup refuses", throwsError(() => GalleryUnit.require(null, selector), `Missing gallery element: ${selector}`));
  const present = { title: "Place 1" };
  TestValidator.predicate("admitted markup retains identity", GalleryUnit.require(present, "h3") === present);
  const supported = createGalleryHostFacts();
  TestValidator.predicate("empty collection refuses", throwsError(() => new GalleryUnit.Controller(supported.host, []), "The gallery needs a building."));
  TestValidator.equals("empty collection has no effects", supported.facts.effects, []);
  const click = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
  let intercepted = 0;
  const fallback = createGalleryHostFacts(false);
  const unsupported = new GalleryUnit.Controller(fallback.host, []);
  TestValidator.equals("unsupported modal keeps static link", unsupported.open(0, "link", click, () => { intercepted++; }), false);
  unsupported.close();
  unsupported.dispose();
  TestValidator.equals("fallback has no interception or effects", [intercepted, fallback.facts.effects], [0, []]);
  const failedModal = createGalleryHostFacts();
  const nativeFailure = new Error("Native modal refused");
  const refused = new GalleryUnit.Controller({
    ...failedModal.host,
    showModal: () => { throw nativeFailure; },
  }, [1]);
  let failure: unknown;
  try { refused.open(0, "capture", click, () => { intercepted++; }); }
  catch (error) { failure = error; }
  TestValidator.predicate("native refusal propagates unchanged", failure === nativeFailure);
  TestValidator.equals("interception precedes failed modal and lock stays absent", [intercepted, failedModal.facts.effects, failedModal.facts.locked], [1, ["building:0", "view:0:0"], false]);
  const singleton = createGalleryHostFacts();
  const single = new GalleryUnit.Controller(singleton.host, [1]);
  single.closed();
  TestValidator.equals("close before opener restores no focus", singleton.facts.focused, null);
  single.open(0, "single-opener", click, () => { intercepted++; });
  for (const direction of [-1, 1] as const) single.moveBuilding(direction);
  for (const key of ["ArrowLeft", "ArrowRight"])
    TestValidator.predicate("plain arrow is intercepted", single.key({ ...click, key }, () => { intercepted++; }));
  TestValidator.equals("singleton remains exterior", [singleton.facts.building, singleton.facts.view], [0, 0]);
  const multi = createGalleryHostFacts();
  const controller = new GalleryUnit.Controller(multi.host, [3, 2]);
  controller.open(0, "first-opener", click, () => { intercepted++; });
  controller.selectView(2);
  controller.key({ ...click, key: "ArrowRight" }, () => { intercepted++; });
  TestValidator.equals("views wrap forward", multi.facts.view, 0);
  controller.key({ ...click, key: "ArrowLeft" }, () => { intercepted++; });
  TestValidator.equals("views wrap backward", multi.facts.view, 2);
  controller.moveBuilding(1);
  TestValidator.equals("building change resets exterior", [multi.facts.building, multi.facts.view], [1, 0]);
  controller.moveBuilding(1);
  TestValidator.equals("buildings wrap", multi.facts.building, 0);
  const before = intercepted;
  for (const patch of [{ button: 1 }, { button: 2 }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }])
    TestValidator.equals("modified click remains native", controller.open(0, "other", { ...click, ...patch }, () => { intercepted++; }), false);
  for (const patch of [{ key: "Escape" }, { key: "ArrowRight", ctrlKey: true }, { key: "ArrowRight", metaKey: true }, { key: "ArrowRight", shiftKey: true }, { key: "ArrowRight", altKey: true }])
    TestValidator.equals("unhandled key remains native", controller.key({ ...click, ...patch }, () => { intercepted++; }), false);
  TestValidator.equals("unsupported events did not intercept", intercepted, before);
  controller.closed();
  TestValidator.equals("late close leaves newer opening", [multi.facts.open, multi.facts.locked, multi.facts.focused], [true, true, null]);
  controller.close();
  TestValidator.equals("actual close restores first opener", [multi.facts.open, multi.facts.locked, multi.facts.focused], [false, false, "first-opener"]);
  controller.dispose();
  TestValidator.equals("dispose releases current content", multi.facts.effects.at(-1), "dispose");
  single.dispose();
};
