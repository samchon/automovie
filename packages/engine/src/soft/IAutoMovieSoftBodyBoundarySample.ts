import { IAutoMovieSoftBodyResolvedAnchor } from "./IAutoMovieSoftBodyResolvedAnchor";
import { IAutoMovieSoftBodyResolvedCapsule } from "./IAutoMovieSoftBodyResolvedCapsule";

/**
 * Complete resolved boundary supplied to simulateSoftBodyWithBoundaries at one absolute step.
 *
 * @evidence contracts/development/design.md#principled-representation One step identifies the anchor and capsule geometry that the fixed-step solver must use together, preserving absolute sampling rather than wall-clock state.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The sampler resolves moving actor geometry while the soft solver receives only its anchors and capsules, without depending on an actor rig.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Full arrays state the current boundary explicitly; the record contains no silently retained prior actor pose or partial-update convention.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the consumer, absolute step and the two resolved geometry populations that must belong to that step.
 */
export interface IAutoMovieSoftBodyBoundarySample {
  /** Absolute solver step. */
  step: number;
  /** Resolved hard anchors for this step. */
  anchors: readonly IAutoMovieSoftBodyResolvedAnchor[];
  /** Resolved body capsules for this step. */
  capsules: readonly IAutoMovieSoftBodyResolvedCapsule[];
}
