import type {
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSupport,
} from "@automovie/interface";
import { supportWindows } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Two binary64 rounding units for dividing integral seconds into shares. */
const ROUNDING: number = 2 * Number.EPSILON;

/**
 * A placed support sequence keeps exactly the contacts shared by neighboring
 * keys.
 *
 * Scenarios:
 *
 * 1. A continuing heel contact ends at the last key where the heel is down.
 *    Reappearing after an absent key opens a separate window.
 * 2. Replacing a grip splits its placement even when its target stays the same. A
 *    fresh hand placement opens at its own arriving key.
 * 3. A prop contact names its exact point, whether authored directly or
 *    through the shared target. A self-support names the performer and region.
 */
export function test_motions_actions_support_windows(): void {
  const heel: IAutoMovieMotionHumanSupport.IContact = {
    part: "leftFoot",
    kind: "bear",
    target: "on",
  };
  const firstGrip: IAutoMovieMotionHumanSupport.IContact = {
    part: "rightHand",
    kind: "grip",
    target: { kind: "prop", subject: "rail", point: "end" },
  };
  const secondGrip = { ...firstGrip, placed: 3 };
  const opening: IAutoMovieMotionHumanSupport.IContact[] = [];
  const windows: IAutoMovieMotionHumanContactWindow[] = supportWindows(
    {
      subject: "lead",
      params: {
        stances: [],
        on: { kind: "prop", subject: "step", point: "top" },
      },
    },
    [
      { seconds: 0, contacts: [heel] },
      { seconds: 1, contacts: [heel] },
      { seconds: 2, contacts: [firstGrip] },
      { seconds: 3, contacts: [secondGrip] },
      { seconds: 4, contacts: [heel, secondGrip] },
    ],
    4,
    (
      _window: IAutoMovieMotionHumanContactWindow,
      contact: IAutoMovieMotionHumanSupport.IContact,
    ): void => {
      opening.push(contact);
    },
    (contact: IAutoMovieMotionHumanSupport.IContact): "heel" | undefined =>
      contact === heel ? "heel" : undefined,
  );
  const [oldFoot, oldHand, newHand, newFoot] = windows;
  TestValidator.predicate(
    "the four windows keep their exact placed identity and endpoint shares",
    windows.length === 4 &&
      opening.length === 4 &&
      opening[0] === heel &&
      opening[1] === firstGrip &&
      opening[2] === secondGrip &&
      opening[3] === heel &&
      oldFoot !== undefined &&
      oldFoot.kind === "plant" &&
      oldFoot.socket === "heel" &&
      oldFoot.support.kind === "prop" &&
      oldFoot.support.subject === "step" &&
      oldFoot.support.point === "top" &&
      nclose(oldFoot.from, 0, ROUNDING) &&
      nclose(oldFoot.to, 0.25, ROUNDING) &&
      oldHand !== undefined &&
      oldHand.kind === "grip" &&
      oldHand.support.kind === "prop" &&
      oldHand.support.subject === "rail" &&
      oldHand.support.point === "end" &&
      nclose(oldHand.from, 0.5, ROUNDING) &&
      nclose(oldHand.to, 0.5, ROUNDING) &&
      newHand !== undefined &&
      nclose(newHand.from, 0.75, ROUNDING) &&
      nclose(newHand.to, 1, ROUNDING) &&
      newFoot !== undefined &&
      nclose(newFoot.from, 1, ROUNDING) &&
      nclose(newFoot.to, 1, ROUNDING),
  );
  TestValidator.equals(
    "self-support follows the actor's named region",
    supportWindows.bearing(
      { subject: "lead", params: { stances: [] } },
      {
        part: "front",
        kind: "bear",
        target: { kind: "self", region: "sternum" },
      },
    ),
    {
      part: "back",
      kind: "lie",
      support: { kind: "person", subject: "lead", region: "sternum" },
    },
  );
}
