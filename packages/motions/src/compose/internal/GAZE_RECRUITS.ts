import type { IAutoMovieMotionHumanGaze } from "@automovie/interface";

/*
 * The segments a gaze primitive may recruit, as data: the eyes alone, or the
 * eyes and the head. The trunk is not a member because the gaze primitive
 * claims the head channel only; the trunk's share of a far gaze is the trunk
 * channel's to write. Re-exported as `AutoMovieMotionHumanGaze.RECRUITS`.
 */
export const GAZE_RECRUITS = [
  "eyes",
  "head",
] as const satisfies readonly NonNullable<IAutoMovieMotionHumanGaze.HeadRecruit>[];
