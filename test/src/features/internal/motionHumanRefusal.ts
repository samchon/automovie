import type { IAutoMovieMotionHumanRefusal } from "@automovie/interface";
import { HumanRefusal } from "@automovie/motions";

/**
 * Observe a public performance's structured refusal without accepting a
 * JavaScript error or the assertion's own failure as that refusal.
 *
 * @param task The actual performance construction.
 * @param expected The invalid input's named kind, parameter and action.
 * @returns Whether that located refusal names its reason and repair.
 * @evidence contracts/development/common.md#meaningful-documentation States what is observed and why generic exceptions are insufficient.
 * @evidence contracts/development/implementation.md#principled-implementation The public HumanRefusal fields are the grammar's repair contract; expected kind, axis and act come from the case's invalid request.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A normal return is false; only the caught structured refusal is inspected.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not manufacture an exception, catch an assertion failure, or accept an unlocated JavaScript error.
 * @evidence contracts/development/implementation.md#efficient-algorithms One construction and constant-sized field checks.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each case observes its own actual construction.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no performance after the call.
 */
export function motionHumanRefusal(
  task: () => unknown,
  expected: {
    kind: IAutoMovieMotionHumanRefusal.Kind;
    axis: string;
    act: string;
  },
): boolean {
  try {
    task();
    return false;
  } catch (error) {
    return (
      error instanceof HumanRefusal &&
      error.kind === expected.kind &&
      error.axis === expected.axis &&
      error.act === expected.act &&
      error.performer === "a" &&
      error.instance > 0 &&
      error.reason.trim().length > 0 &&
      error.fix.trim().length > 0 &&
      !/\bundefined\b/.test(`${error.reason} ${error.fix}`)
    );
  }
}
