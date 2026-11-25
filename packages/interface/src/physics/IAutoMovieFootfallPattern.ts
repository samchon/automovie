import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Contact timing and support geometry for arbitrary articulated limbs.
 *
 * Chains use actual profile bone identities in proximal-to-distal order. Phase
 * and duty are cycle fractions; stride tables map nonnegative metres-per-second
 * speeds to positive metre lengths. admitPhysicalSupportPattern checks finite
 * coordinates, existing distinct carriers, consecutive chains, at most 64 floor
 * witnesses per limb and strictly increasing nonempty stride samples. Its
 * stepping mode requires at least one limb beyond minimumSupports. Omitted
 * localPoint selects the bone origin; omitted contacts selects the endpoint
 * carrier.
 */
export interface IAutoMovieFootfallPattern {
  /** Stable description identity. */
  id: string;
  /** Nonempty unique support limbs. */
  limbs: {
    /** Arbitrary bone id of the support endpoint. */
    bone: string;
    /** Bone-local support endpoint in metres; omission selects the bone origin. */
    localPoint?: IAutoMovieVector3;
    /**
     * Segment colliders belonging to this support patch; defaults to the
     * endpoint alone.
     */
    contacts?: string[];
    /**
     * Actual local surface witnesses which share the floor while planted;
     * omission fits only the lowest convex point.
     */
    floorPoints?: {
      /** Segment carrying the witness. */ bone: string;
      /** Segment-local surface location, metres. */ localPoint: IAutoMovieVector3;
    }[];
    /** Proximal-to-distal chain, ending at bone. */
    chain: string[];
    /**
     * Optional two-link reach witness; distal offset from tip to support stays
     * rigid during root-reach planning.
     */
    reach?: {
      /** First joint. */ root: string;
      /** Middle joint. */ middle: string;
      /** Last joint. */ tip: string;
    };
    /** Relative lift phase in [0,1). */
    phase: number;
    /** Planted fraction in [0,1]; zero declares no mandatory planted dwell. */
    duty: number;
    /** Neutral support location in the forward/left plane, metres. */
    offset: {
      /** Metres along the body's declared forward direction. */
      forward: number;

      /** Metres along the body's declared left direction. */
      left: number;
    };
    /** Increasing speed samples with positive stride lengths. */
    stride: {
      /** Nonnegative travel speed in metres per second. */
      speed: number;

      /** Positive stride length in metres at that speed. */
      length: number;
    }[];
  }[];
  /** Minimum simultaneous planted supports; zero explicitly permits suspension. */
  minimumSupports: number;
}
