import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One compact formation-level transform state relative to its designed base.
 */
export interface IAutoMovieFormationMotionState {
  /** World-space translation added to the designed formation anchor. */
  translation: IAutoMovieVector3;

  /** Heading offset added around the designed anchor, in degrees. */
  facingOffsetDeg: number;

  /** Positive lateral and depth scale for bounded density deformation. */
  spacingScale: {
    /** Left-to-right spacing multiplier. */
    lateral: number;

    /** Front-to-back spacing multiplier. */
    depth: number;
  };
}
