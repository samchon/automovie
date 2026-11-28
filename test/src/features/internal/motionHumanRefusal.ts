import type { IAutoMovieMotionHumanRefusal } from "@automovie/interface";
import { AutoMovieMotionHumanRefusal } from "@automovie/motions";

/**
 * Check the located refusal thrown during synchronous performance construction.
 *
 * @param task Performance construction to call.
 * @param expected Kind, axis and action required of the refusal.
 * @returns Whether subject a received the expected refusal with a positive
 * action instance and nonblank reason and repair text.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the structured refusal fields, the fixture subject, the instance requirement and the required reason and repair.
 * @evidence contracts/development/implementation.md#principled-implementation Recognizes the public AutoMovieMotionHumanRefusal class and matches the requested kind, axis and action. It also requires a located instance and checks both messages for missing text and a literal undefined token.
 * @evidence contracts/development/implementation.md#efficient-algorithms Calls construction once and checks one exception with a fixed number of field and message comparisons. The result retains neither construction nor performance state.
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
      error instanceof AutoMovieMotionHumanRefusal &&
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
