import type { IAutoMovieHumanBodyShoulderPose } from "../IAutoMovieHumanBodyShoulderPose";
import type { IAutoMovieHumanBodyShoulderRange } from "./IAutoMovieHumanBodyShoulderRange";

/**
 * A source upper arm's TT authoring contract, preserving the existing neutral direction and plane-dependent reach.
 *
 * @evidence contracts/common.md#principled-implementation Carries the TT literal, neutral orientation and supported reach, preserving the original upper-arm source contract without a new solver.
 * @evidence contracts/common.md#clear-and-simple-design This named record owns only the original upper-arm source contract without a new solver; computations remain at the existing consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The thorax-tt discriminant and inherited neutral coordinates retain one shoulder convention; the range is not replaced by independent Euler limits.
 * @evidence contracts/common.md#meaningful-documentation Native field documentation names the retained members, their ownership and unchanged source meaning.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source and consuming builder own the represented parts; this record transports their existing registration/evaluation.
 * @evidence contracts/modeling.md#parameter-channels The closed thorax-tt convention preserves named total humerothoracic goals through the same neutral/range contract; public goals address neither vertices nor raw matrices.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The existing geometry/appearance consumer owns emitted populations.
 * @evidence contracts/modeling.md#spatial-conventions Neutral and range use degrees in the body thorax frame: +X subject left, +Y superior and +Z anterior; TT pole equivalences remain those of IAutoMovieHumanBodyShoulderPose.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source and assembly owners retain actual boundary construction.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming source/assembly owner observes the result.
 * @evidence contracts/anatomy.md#anatomical-source The compiled source supplies TT neutral and reach; these source conventions are not independently measured shoulder capacity.
 * @evidence contracts/anatomy.md#permitted-range The record defines source elevation/axial intervals and the periodic plane-dependent reach. Existing shoulder source admission and pose resolution validate the intervals and combined reach without changing caller goals; this schema alone proves no physiological capacity.
 * @evidence contracts/anatomy.md#parametric-authority The closed thorax-tt convention preserves named total humerothoracic goals through the same neutral/range contract; public goals address neither vertices nor raw matrices.
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
