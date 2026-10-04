import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * The rigid motion that carries a face part from the neutral frame onto the
 * posed head of a shaped body: `point(p) = R (p + shift) + t`.
 *
 * @evidence contracts/common.md#principled-implementation A rigid motion is one rotation and one translation; the shift is the shape carry and the rotation the pose.
 * @evidence contracts/common.md#clear-and-simple-design Two values and two maps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Built from the body's own frames by one owner.
 * @evidence contracts/common.md#meaningful-documentation States the formula and each member.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the shared Y-up, +Z-forward frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The transform defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The transform is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The transform emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The transform builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The transform is not observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The transform carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The transform admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The transform is derived.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadTransform {
  /** The change of orientation the posed bone makes from its rest, `posed * rest⁻¹`. */
  rotation: IAutoMovieQuaternion;

  /** The rest-frame translation alone: the anchor's shaped minus neutral position. */
  shift: IAutoMovieVector3;

  /** Carry a neutral-frame point onto the posed head. */
  point(p: IAutoMovieVector3): IAutoMovieVector3;

  /** Rotate a direction by the posed change of orientation. */
  direction(n: IAutoMovieVector3): IAutoMovieVector3;
}
