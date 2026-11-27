import type { IAutoMovieMotionHumanArmPhrase } from "./IAutoMovieMotionHumanArmPhrase";

/**
 * The acting hand and manner of an ear tuck. The right hand and neutral manner
 * are used when omitted. `both` sweeps each ear on the same clock. Register
 * `tuckHair` with the performance before authoring it by name.
 */
export type AutoMovieMotionHumanTuckHairParams = Pick<
  IAutoMovieMotionHumanArmPhrase.IParams,
  "hand" | "manner"
>;
