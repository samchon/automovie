import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One compact formation-level transform state relative to its designed base.
 *
 * @evidence contracts/common.md#principled-implementation Translation is a world-space offset, heading is additive in degrees and spacing is multiplied in the unit frame; separating these channels preserves their distinct composition order during sampling and slot placement.
 * @evidence contracts/common.md#clear-and-simple-design One state holds only the three formation-wide channels interpolated by sampleFormationMotion; changing arrangement belongs to the cue's layout field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positive spacing multipliers preserve non-collapsed local spacing; identity is explicitly zero translation and heading with unit spacing, not an inferred missing state.
 * @evidence contracts/common.md#meaningful-documentation Defines world versus unit frames, heading units, additive offsets and positive spacing multipliers.
 * @author Samchon
 */
export interface IAutoMovieFormationMotionState {
  /** World-space translation in meters added to the designed formation anchor. */
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
