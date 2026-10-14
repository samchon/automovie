import { TestValidator } from "@nestia/e2e";

import { GalleryController } from "../../../../website/src/gallery/GalleryController";
import { requireGalleryValue } from "../../../../website/src/gallery/requireGalleryValue";
import { createGalleryHostFacts } from "../internal/createGalleryHostFacts";
import { throwsError } from "../internal/predicates";

/**
 * Authored markup and reported modal capability govern enhancement admission. Selection owns wrapping and close notifications through the existing callback seam without recreating a DOM or replacing its modal/layout methods.
 *
 * Scenarios:
 * 1. Missing markup and an empty supported collection refuse before effects; unsupported modal keeps ordinary link behavior and has no teardown effect.
 * 2. Singleton and multi-view navigation wrap, and a building change resets exterior; modified clicks/keys are never intercepted.
 * 3. A delayed close while currently open leaves the new lock/focus intact; a supplied close callback and disposal retire their own state and request content cleanup.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls gallery admission, selection and lifecycle owners through direct source imports and the existing owned effect port; assertions observe markup refusal, interception, native failure propagation, wrap/reset behavior and disposed authority.
 * @evidence contracts/testing.md#independent-expectations Authored element presence, plain primary click/key admission, modular navigation and the supplied native failure determine expectations; literal host observations do not derive expected values from controller output.
 * @evidence contracts/testing.md#distinguishing-cases Covers missing and present elements, unsupported modal, empty/singleton/multiple views, modified clicks and keys, failed modal entry, delayed close and disposal; image errors and independent cleanup failures belong to neighboring Gallery units.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit imports the canonical Gallery sources directly and supplies existing owned callbacks; it installs no DOM, browser, foreign replacement or asset, and cannot certify native Escape or focus behavior.
 */
export function test_website_gallery_boundaries(): void {
  for (const selector of ["#gallery", "h3"])
    TestValidator.predicate(
      "missing markup refuses",
      throwsError(
        (): null => requireGalleryValue(null, selector),
        `Missing gallery element: ${selector}`,
      ),
    );
  const present: { title: string } = { title: "Place 1" };
  TestValidator.predicate(
    "admitted markup retains identity",
    requireGalleryValue(present, "h3") === present,
  );
  const supported: {
    facts: {
      open: boolean;
      locked: boolean;
      focused: string | null;
      building: number;
      view: number;
      effects: string[];
    };
    host: {
      supportsModal: boolean;
      isOpen: () => boolean;
      renderBuilding: (index: number) => void;
      renderView: (building: number, view: number) => void;
      showModal: () => void;
      closeModal: () => void;
      setLocked: (locked: boolean) => void;
      focus: (opener: string) => void;
      disposeContents: () => void;
    };
  } = createGalleryHostFacts();
  TestValidator.predicate(
    "empty collection refuses",
    throwsError(
      (): GalleryController<string> =>
        new GalleryController(supported.host, []),
      "The gallery needs a building.",
    ),
  );
  TestValidator.equals(
    "empty collection has no effects",
    supported.facts.effects,
    [],
  );
  const click: {
    button: number;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
  } = {
    button: 0,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
  };
  let intercepted: number = 0;
  const fallback: {
    facts: {
      open: boolean;
      locked: boolean;
      focused: string | null;
      building: number;
      view: number;
      effects: string[];
    };
    host: {
      supportsModal: boolean;
      isOpen: () => boolean;
      renderBuilding: (index: number) => void;
      renderView: (building: number, view: number) => void;
      showModal: () => void;
      closeModal: () => void;
      setLocked: (locked: boolean) => void;
      focus: (opener: string) => void;
      disposeContents: () => void;
    };
  } = createGalleryHostFacts(false);
  const unsupported: GalleryController<string> = new GalleryController(
    fallback.host,
    [],
  );
  TestValidator.equals(
    "unsupported modal keeps static link",
    unsupported.open(0, "link", click, (): void => {
      intercepted++;
    }),
    false,
  );
  unsupported.close();
  unsupported.dispose();
  TestValidator.equals(
    "fallback has no interception or effects",
    [intercepted, fallback.facts.effects],
    [0, []],
  );
  const failedModal: {
    facts: {
      open: boolean;
      locked: boolean;
      focused: string | null;
      building: number;
      view: number;
      effects: string[];
    };
    host: {
      supportsModal: boolean;
      isOpen: () => boolean;
      renderBuilding: (index: number) => void;
      renderView: (building: number, view: number) => void;
      showModal: () => void;
      closeModal: () => void;
      setLocked: (locked: boolean) => void;
      focus: (opener: string) => void;
      disposeContents: () => void;
    };
  } = createGalleryHostFacts();
  const nativeFailure: Error = new Error("Native modal refused");
  const refused: GalleryController<string> = new GalleryController(
    {
      ...failedModal.host,
      showModal: (): never => {
        throw nativeFailure;
      },
    },
    [1],
  );
  let failure: unknown;
  try {
    refused.open(0, "capture", click, (): void => {
      intercepted++;
    });
  } catch (error) {
    failure = error;
  }
  TestValidator.predicate(
    "supplied modal refusal propagates unchanged",
    failure === nativeFailure,
  );
  TestValidator.equals(
    "interception precedes failed modal and lock stays absent",
    [intercepted, failedModal.facts.effects, failedModal.facts.locked],
    [1, ["building:0", "view:0:0"], false],
  );
  const singleton: {
    facts: {
      open: boolean;
      locked: boolean;
      focused: string | null;
      building: number;
      view: number;
      effects: string[];
    };
    host: {
      supportsModal: boolean;
      isOpen: () => boolean;
      renderBuilding: (index: number) => void;
      renderView: (building: number, view: number) => void;
      showModal: () => void;
      closeModal: () => void;
      setLocked: (locked: boolean) => void;
      focus: (opener: string) => void;
      disposeContents: () => void;
    };
  } = createGalleryHostFacts();
  const single: GalleryController<string> = new GalleryController(
    singleton.host,
    [1],
  );
  single.closed();
  TestValidator.equals(
    "close before opener restores no focus",
    singleton.facts.focused,
    null,
  );
  single.open(0, "single-opener", click, (): void => {
    intercepted++;
  });
  for (const direction of [-1, 1] as const) single.moveBuilding(direction);
  for (const key of ["ArrowLeft", "ArrowRight"])
    TestValidator.predicate(
      "plain arrow is intercepted",
      single.key({ ...click, key }, (): void => {
        intercepted++;
      }),
    );
  TestValidator.equals(
    "singleton remains exterior",
    [singleton.facts.building, singleton.facts.view],
    [0, 0],
  );
  const multi: {
    facts: {
      open: boolean;
      locked: boolean;
      focused: string | null;
      building: number;
      view: number;
      effects: string[];
    };
    host: {
      supportsModal: boolean;
      isOpen: () => boolean;
      renderBuilding: (index: number) => void;
      renderView: (building: number, view: number) => void;
      showModal: () => void;
      closeModal: () => void;
      setLocked: (locked: boolean) => void;
      focus: (opener: string) => void;
      disposeContents: () => void;
    };
  } = createGalleryHostFacts();
  const controller: GalleryController<string> = new GalleryController(
    multi.host,
    [3, 2],
  );
  controller.open(0, "first-opener", click, (): void => {
    intercepted++;
  });
  controller.selectView(2);
  controller.key({ ...click, key: "ArrowRight" }, (): void => {
    intercepted++;
  });
  TestValidator.equals("views wrap forward", multi.facts.view, 0);
  controller.key({ ...click, key: "ArrowLeft" }, (): void => {
    intercepted++;
  });
  TestValidator.equals("views wrap backward", multi.facts.view, 2);
  controller.moveBuilding(1);
  TestValidator.equals(
    "building change resets exterior",
    [multi.facts.building, multi.facts.view],
    [1, 0],
  );
  controller.moveBuilding(1);
  TestValidator.equals("buildings wrap", multi.facts.building, 0);
  const before: number = intercepted;
  for (const patch of [
    { button: 1 },
    { button: 2 },
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { altKey: true },
  ])
    TestValidator.equals(
      "modified click remains native",
      controller.open(0, "other", { ...click, ...patch }, (): void => {
        intercepted++;
      }),
      false,
    );
  for (const patch of [
    { key: "Escape" },
    { key: "ArrowRight", ctrlKey: true },
    { key: "ArrowRight", metaKey: true },
    { key: "ArrowRight", shiftKey: true },
    { key: "ArrowRight", altKey: true },
  ])
    TestValidator.equals(
      "unhandled key remains native",
      controller.key({ ...click, ...patch }, (): void => {
        intercepted++;
      }),
      false,
    );
  TestValidator.equals(
    "unsupported events did not intercept",
    intercepted,
    before,
  );
  controller.closed();
  TestValidator.equals(
    "late close leaves newer opening",
    [multi.facts.open, multi.facts.locked, multi.facts.focused],
    [true, true, null],
  );
  controller.close();
  TestValidator.equals(
    "supplied close restores first opener",
    [multi.facts.open, multi.facts.locked, multi.facts.focused],
    [false, false, "first-opener"],
  );
  controller.dispose();
  TestValidator.equals(
    "dispose releases current content",
    multi.facts.effects.at(-1),
    "dispose",
  );
  single.dispose();
}
