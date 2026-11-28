import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  requireOtherPerformer
} from "../../../../../packages/motions/src/touch/internal/requireOtherPerformer";
import { strict as assert } from "node:assert";

/**
 * Check performer identity before composing a partner-only touch.
 *
 * Scenarios:
 *
 * 1. Admit performer `a` touching performer `b` .
 * 2. For `a` touching `a` , report a parameter refusal on `partner` with
 *    identity `a` and the supplied explanation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases state the identity rule and the refusal fields.
 * @evidence contracts/development/testing.md#behavioral-verification The exact partner gate receives a distinct pair and a self pair.
 * @evidence contracts/development/testing.md#independent-expectations Only the second identity changes between the fixed test pairs.
 */
export function test_motions_touch_partner_touch(): void {
  const reason: string = "a performer embraces another performer";
  requireOtherPerformer("a", "b", reason);
  assert.throws(
    () => requireOtherPerformer("a", "a", reason),
    (error: unknown): boolean =>
      error instanceof AutoMovieMotionHumanRefusal &&
      error.kind === "parameter" &&
      error.axis === "partner" &&
      error.value === "a" &&
      error.reason === reason,
  );
}
