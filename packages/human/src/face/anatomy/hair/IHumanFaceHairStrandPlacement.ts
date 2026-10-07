import type { IAutoMovieHumanFaceHairCurve } from "./IAutoMovieHumanFaceHairCurve";
import type { IAutoMovieHumanFaceHairRootedTransition } from "./IAutoMovieHumanFaceHairRootedTransition";
import type { IHumanFaceHairContact } from "./IHumanFaceHairContact";
import type { IHumanFaceHairStrandSample } from "./IHumanFaceHairStrandSample";

/**
 * One strand's placement request to `growHumanFaceHairStrand`.
 *
 * The rooted stem was already admitted by the owning metric walk; placement
 * projects the remainder with the same contact and, on rejection, resumes that
 * walk once through `integrate`.
 *
 * @evidence contracts/common.md#principled-implementation Carries the interpolated strand, the walk's own contact and stem, and the resumption of that same walk.
 * @evidence contracts/common.md#clear-and-simple-design Named members replace an anonymous parameter object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejection resumes the same walk instead of relaunching or stretching the strand.
 * @evidence contracts/common.md#meaningful-documentation States what was admitted before and what rejection does.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The members state their own frames.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Placement emits the curve.
 * @evidence contracts/modeling.md#shared-boundaries Placement uses the same contact instance that certified the stem.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical state only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairStrandPlacement {
  /** The interpolated strand to place. */
  strand: IHumanFaceHairStrandSample;

  /** Contact of the owning walk. */
  contact: IHumanFaceHairContact;

  /** Canonical stem, already admitted by the owning metric walk. */
  rooted: IAutoMovieHumanFaceHairRootedTransition;

  /**
   * Placement rejection resumes the same walk; standalone callers may grow it.
   *
   * @evidence contracts/common.md#principled-implementation Resumes the owning walk with its field, gather state and remaining budget.
   * @evidence contracts/common.md#clear-and-simple-design One caller-supplied callback with a single responsibility.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Never starts a second launch; a resumed producer's error propagates unchanged.
   * @evidence contracts/common.md#meaningful-documentation States when it is called and what its result means.
   * @evidence contracts/modeling.md#spatial-conventions Points are current head-frame metres; directions are unit vectors.
   * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The integrator emits stations.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The contact owns the boundary.
   * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical state only.
   * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Derived callback, not a personal control.
   */
  integrate: () => IAutoMovieHumanFaceHairCurve | undefined;
}
