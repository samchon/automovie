import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  shift
} from "../../../../../packages/motions/src/everyday/internal/shift";
import { strict as assert } from "node:assert";

/** A seated slide keeps its sign and stays within 35% of the planted thigh. */
export function test_motions_everyday_shift(): void {
  assert.equal(shift.travel(0.4, -0.1), -0.1);
  assert.equal(shift.travel(0.4, 0.1), 0.1);
  for (const travel of [-0.15, 0.15])
    assert.throws(
      () => shift.travel(0.4, travel),
      (error: unknown): boolean =>
        error instanceof AutoMovieMotionHumanRefusal &&
        error.axis === "by" &&
        error.value === travel,
    );
  assert.equal(shift.travel(0.5, 0.15), 0.15);
}
