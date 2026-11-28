import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  admitLapSupport
} from "../../../../../packages/motions/src/touch/internal/admitLapSupport";
import { strict as assert } from "node:assert";

/**
 * Check lap support against the partner's measured thigh.
 *
 * Scenarios:
 *
 * 1. With a 0.4 m thigh, admit knee drops of zero and 0.2 m.
 * 2. At 0.201 m report a base refusal on `partner` . Admit that same drop
 *    with a 0.5 m thigh.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases show the inclusive bearing limit and the name in the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification The support gate compares two body measurements at the same borderline drop.
 * @evidence contracts/development/testing.md#independent-expectations Half the given thigh length separates the admitted and refused geometries.
 */
export function test_motions_touch_sit_on_lap(): void {
  admitLapSupport("partner", 0, 0.4);
  admitLapSupport("partner", 0.2, 0.4);
  assert.throws(
    () => admitLapSupport("partner", 0.201, 0.4),
    (error: unknown): boolean =>
      error instanceof AutoMovieMotionHumanRefusal &&
      error.kind === "base" &&
      error.axis === "partner" &&
      error.value === "partner",
  );
  admitLapSupport("partner", 0.201, 0.5);
}
