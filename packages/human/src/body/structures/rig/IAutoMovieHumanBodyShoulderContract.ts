import type { IAutoMovieHumanBodyShoulderPose } from "../IAutoMovieHumanBodyShoulderPose";
import type { IAutoMovieHumanBodyShoulderRange } from "./IAutoMovieHumanBodyShoulderRange";

/**
 * A source upper arm's TT authoring contract, preserving the existing neutral direction and plane-dependent reach.
 *
 * @evidence contracts/common.md#principled-implementation A fixed thorax-tt convention links one neutral humeral orientation with its plane-dependent admitted reach.
 * @evidence contracts/common.md#clear-and-simple-design The contract groups neutral and range while omitting the goal's per-side bone identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The source A-pose and reach remain basis data rather than a certified individual's shoulder mechanics.
 * @evidence contracts/common.md#meaningful-documentation Members name the coordinate convention, neutral goal fields and reach owner.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shoulder source contract has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shoulder source contract schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The shoulder source contract declaration allocates no runtime state or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyShoulderContract {
  /** Existing thorax-relative tilt/torsion convention. */
  coordinates: "thorax-tt";

  /** Source A-pose TT direction and axial zero, in the same units as the existing goal without its bone identity. */
  neutral: Omit<IAutoMovieHumanBodyShoulderPose, "bone">;

  /** Existing total-elevation, rotation and plane-envelope admission. */
  range: IAutoMovieHumanBodyShoulderRange;
}
