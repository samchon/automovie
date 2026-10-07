import type { IHumanFaceHairContact } from "./IHumanFaceHairContact";

/**
 * A derived metric target and the contact it is walked against.
 *
 * Interpolation can give a strand a length different from its regional
 * length; the integrator and the curve start then walk that length against
 * this contact instead of deriving their own.
 *
 * @evidence contracts/common.md#principled-implementation Keeps the walked length and the contact that certifies it together.
 * @evidence contracts/common.md#clear-and-simple-design Two named members replace a repeated anonymous pair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplies no fallback length or tolerance.
 * @evidence contracts/common.md#meaningful-documentation States why a derived metric replaces the regional length.
 * @evidence contracts/modeling.md#spatial-conventions The length is metres along the curve in the head frame.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The integrator emits stations.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The contact owns the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical state only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairMetric {
  /** Target curve length in metres. */
  length: number;

  /** Contact the length is walked against. */
  contact: IHumanFaceHairContact;
}
