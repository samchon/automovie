import type { IHumanFaceHairSampledRoot } from "./IHumanFaceHairSampledRoot";

/**
 * Sampled source roots and the observed accepted share of the neutral domain.
 *
 * @evidence contracts/common.md#principled-implementation The sampler's actual roots and neutral acceptance fraction remain separate from current-shape area and biological density.
 * @evidence contracts/common.md#clear-and-simple-design Composes the shared sampled-root type with one measured sampling share.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Acceptance share is produced by sampling rather than copied from an expected density.
 * @evidence contracts/common.md#meaningful-documentation States neutral sampling measure and the current-area comparison limit.
 * @evidence contracts/modeling.md#spatial-conventions Share is dimensionless and root vectors retain their type's head-frame units.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The sampler owns identities.
 * @evidenceExclude contracts/modeling.md#parameter-channels This result defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The sampler determines population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Seating consumes sampled references.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair consumer observes output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Sampling share is not a physiological follicle density.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record admits no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This is generated sampling output.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootPopulation {
  /** Roots retain sequence and original barycentric reference, not personal authored vertices. */
  roots: IHumanFaceHairSampledRoot[];

  /** Mask acceptance fraction in the neutral sampling measure; not current-shape area integration. */
  share: number;
}
