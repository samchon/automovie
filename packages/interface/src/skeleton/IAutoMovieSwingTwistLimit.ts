import type { IAutoMovieAngleRange } from "./IAutoMovieAngleRange";

/** The swing-and-twist limit of a ball joint. */
export interface IAutoMovieSwingTwistLimit {
  /**
   * The limb's turn about its own long axis measured from the rig's rest pose
   * by the swing-twist decomposition, degrees; positive external, negative
   * internal.
   */
  twist: IAutoMovieAngleRange;

  /**
   * The farthest the limb's long axis may point from its rest direction,
   * degrees, below 180, so the rest direction's antipode, where the twist has
   * no value, lies outside the range; the reach the flexion and abduction
   * intervals give when absent.
   */
  reach?: number;
}
