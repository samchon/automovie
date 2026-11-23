import type { IAutoMovieHumanTrunkFeatureFrame } from "./IAutoMovieHumanTrunkFeatureFrame";

/**
 * Gluteal frame, footprint reaches and projection resolved from the trunk's
 * anatomical sites.
 *
 * The interface package owns these declarations; AutoMovieHumanGlutealDome in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanGlutealDome {
  /** What the dome reads. */
  export interface IInput {
    /** The gluteal frame. */
    frame: IAutoMovieHumanTrunkFeatureFrame.IFrame;

    /** The section's half width at the buttock point, mm. */
    width: number;

    /**
     * The buttock point's height over the crotch ring, mm: the footprint's
     * lower reach.
     */
    lower: number;

    /**
     * Iliocristale's height over the buttock point, mm: the footprint's upper
     * reach.
     */
    upper: number;

    /** The buttock point's projection, mm. */
    projection: number;
  }
}
