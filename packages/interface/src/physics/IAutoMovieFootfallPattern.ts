import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Contact timing for arbitrary support limbs, independent of the humanoid
 * open-loop gait oscillator. A chain names actual bones; phase and duty are
 * fractions of a cycle. Speed/stride samples use m/s and metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Contact timing for arbitrary support limbs, independent of the humanoid open-loop gait oscillator) and documents 3 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Contact timing for arbitrary support limbs, independent of the humanoid open-loop gait oscillator: interface of 3 members (`id`, `limbs`, `minimumSupports`); units and frames named in its text: local, metres. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAutoMovieFootfallPattern` in packages/interface/src/physics/IAutoMovieFootfallPattern.ts; its surface is the 3 members listed and the text shows 33 other files naming it, mostly packages/engine (16), test (15), packages/human (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
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
    /** Segment colliders belonging to this support patch; defaults to the endpoint alone. */
    contacts?: string[];
    /** Actual local surface witnesses which share the floor while planted; omission fits only the lowest convex point. */
    floorPoints?: {
      /** Segment carrying the witness. */ bone: string;
      /** Segment-local surface location, metres. */ localPoint: IAutoMovieVector3;
    }[];
    /** Proximal-to-distal chain, ending at bone. */
    chain: string[];
    /** Optional two-link reach witness; distal offset from tip to support stays rigid during root-reach planning. */
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
    offset: { forward: number; left: number };
    /** Increasing speed samples with positive stride lengths. */
    stride: { speed: number; length: number }[];
  }[];
  /** Minimum simultaneous planted supports; zero explicitly permits suspension. */
  minimumSupports: number;
}
