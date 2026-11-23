import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";

/**
 * A fingertip or pad goal with optional contact normal. Coordinates are world
 * metres unless on names a posed bone frame; HumanDigitFit resolves that frame
 * and fits the digit.
 */
export interface IAutoMovieHumanDigitGoal {
  /**
   * Where the surface goes, world metres, or in the posed frame of `on` when
   * given.
   */
  point: IAutoMovieVector3;

  /**
   * The outward normal of the surface touched, world (or `on`'s posed frame);
   * the digit's surface is turned to face against it. Any direction when
   * absent.
   */
  normal?: IAutoMovieVector3;

  /** Which surface of the digit: its tip or its pad. */
  surface: "tip" | "pad";

  /**
   * The bone the goal rides, when it moves with the body: `point` and `normal`
   * are then in its posed frame, read from the pose as fitted, so a fingertip
   * on the other hand's palm stays there. A goal on a prop is written by its
   * law in the world from the prop's frame at the instant.
   */
  on?: AutoMovieHumanoidBone;

  /**
   * The fingertip bears on a world-space surface at this instant. The digit
   * reaches the point without the easing used for an aim in free space.
   */
  contact?: boolean;
}
