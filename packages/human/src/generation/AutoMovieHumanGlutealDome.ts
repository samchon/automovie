import { AutoMovieHumanGlutealProfile } from "./AutoMovieHumanGlutealProfile";
import { AutoMovieHumanTrunkFeatureFrame } from "./AutoMovieHumanTrunkFeatureFrame";
import { AutoMovieHumanTrunkFeatureProfile } from "./AutoMovieHumanTrunkFeatureProfile";
import type { IAutoMovieHumanTrunkFeature } from "./IAutoMovieHumanTrunkFeature";

/**
 * The gluteal mass: the profile swept over its footprint in the gluteal
 * frame, from the crotch ring (which it leaves untouched, so the legs keep
 * their ring) up to iliocristale, across from `MEDIAL` to `OUTER` of the half
 * width, so the cleft between the two buttocks stays the base's own.
 */
export namespace AutoMovieHumanGlutealDome {
  /** The apex's lateral share of the half width: the buttock point lies a little inside the mass's middle. Conventional, flagged. */
  export const LATERAL: number = 0.45;

  /** The footprint's medial share of the half width. Conventional, flagged. */
  export const MEDIAL: number = 0.08;

  /** The footprint's outer share of the half width. Conventional, flagged. */
  export const OUTER: number = 0.95;

  /** What the dome reads. */
  export interface IInput {
    /** The gluteal frame. */
    frame: AutoMovieHumanTrunkFeatureFrame.IFrame;

    /** The section's half width at the buttock point, mm. */
    width: number;

    /** The buttock point's height over the crotch ring, mm: the footprint's lower reach. */
    lower: number;

    /** Iliocristale's height over the buttock point, mm: the footprint's upper reach. */
    upper: number;

    /** The buttock point's projection, mm. */
    projection: number;
  }

  /**
   * The dome as a feature.
   *
   * @param input The frame, footprint data and projection.
   * @returns The gluteal mass as a height field.
   */
  export function create(input: IInput): IAutoMovieHumanTrunkFeature {
    const half: number = ((OUTER - MEDIAL) / 2) * input.width;

    // The footprint's centre stands outward of the apex by the shares' difference;
    // the frame's lateral axis points toward the midline on the back wall.
    const centre: number = ((OUTER + MEDIAL) / 2 - LATERAL) * input.width * input.frame.lateral[2];
    const lower: number = Math.max(1, input.lower);
    const upper: number = Math.max(1, input.upper);

    return {
      frame: input.frame,
      height: (u: number, v: number): number =>
        AutoMovieHumanGlutealProfile.height(AutoMovieHumanTrunkFeatureProfile.rho(u - centre, v, half, lower, upper), input.projection),
      reach: { u: [centre - half, centre + half], v: [-lower, upper] },
      apex: [centre, 0],
    };
  }
}
