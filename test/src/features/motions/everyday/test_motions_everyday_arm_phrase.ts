import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  armPhrase
} from "../../../../../packages/motions/src/everyday/internal/armPhrase";
import { strict as assert } from "node:assert";

/**
 * A free phrase can use either or both hands. A named point needs its prop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Free phrases may use either hand or both. A named point requires its prop, and the phrase refuses incompatible hand inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the arm-phrase admission functions with typed side and prop choices, including invalid combinations.
 * @evidence contracts/development/testing.md#independent-expectations The named point has no world source without its prop. The free modes and invalid input checks distinguish that missing source from ordinary side choice.
 */
export function test_motions_everyday_arm_phrase(): void {
  assert.deepEqual(armPhrase.selectHands({}, {}), ["right"]);
  assert.deepEqual(
    armPhrase.selectHands({ hand: "both" }, {}),
    ["left", "right"],
  );
  assert.deepEqual(
    armPhrase.selectHands(
      { hand: "left", held: "chalk", point: "tip" },
      { left: "chalk" },
    ),
    ["left"],
  );
  assert.throws(
    () =>
      armPhrase.selectHands({ hand: "left", held: "chalk" }, { right: "chalk" }),
    refuses("held"),
  );
  assert.throws(
    () =>
      armPhrase.selectHands({ hand: "both", held: "chalk" }, { left: "chalk" }),
    refuses("held"),
  );
  assert.throws(
    () => armPhrase.selectHands({ point: "tip" }, {}),
    refuses("point"),
  );
}

/** Match the refused input at the primitive's boundary. */
function refuses(axis: string): (error: unknown) => boolean {
  return (error: unknown): boolean =>
    error instanceof AutoMovieMotionHumanRefusal && error.axis === axis;
}
