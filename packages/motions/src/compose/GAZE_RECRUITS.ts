import type { IAutoMovieMotionHumanGaze } from "@automovie/interface";

/**
 * The segments a gaze primitive may recruit, as data: the eyes alone, or the
 * eyes and the head. The trunk is not a member because the gaze primitive
 * claims the head channel only; the trunk's share of a far gaze is the trunk
 * channel's to write. Re-exported as `AutoMovieMotionHumanGaze.RECRUITS`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two recruitments and why the trunk is not one.
 * @evidence contracts/development/design.md#principled-representation The closed union `IAutoMovieMotionHumanGaze.HeadRecruit` as a readonly tuple, so the union and its data cannot differ.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The recruitments and nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tuple is checked against the union with `satisfies`, so a member added to one and not the other fails to compile.
 */
export const GAZE_RECRUITS = [
  "eyes",
  "head",
] as const satisfies readonly NonNullable<IAutoMovieMotionHumanGaze.HeadRecruit>[];
