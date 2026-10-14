import { IAutoMovieSoftBodyResolvedAnchor } from "./IAutoMovieSoftBodyResolvedAnchor";
import { IAutoMovieSoftBodyResolvedCapsule } from "./IAutoMovieSoftBodyResolvedCapsule";

/**
 * Complete resolved boundary supplied to simulateSoftBodyWithBoundaries at one absolute step.
 *
 * @evidence contracts/common.md#principled-implementation One step identifies the anchor and capsule geometry that the fixed-step solver must use together, preserving absolute sampling rather than wall-clock state.
 * @evidence contracts/common.md#clear-and-simple-design The sampler resolves moving actor geometry while the soft solver receives only its anchors and capsules, without depending on an actor rig.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Full arrays state the current boundary explicitly; the record contains no silently retained prior actor pose or partial-update convention.
 * @evidence contracts/common.md#meaningful-documentation Identifies the consumer, absolute step and the two resolved geometry populations that must belong to that step.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This boundary record executes no collision or sampling algorithm; producer and fixed-step solver own those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A sample applies to one absolute step, and sharing immutable boundary storage is the supplying sampler's decision.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Arrays are caller-owned readonly views; releasing the current boundary reference releases this record's reach to resolved geometry.
 * @author Samchon
 */
export interface IAutoMovieSoftBodyBoundarySample {
  /** Absolute solver step. */
  step: number;
  /** Resolved hard anchors for this step. */
  anchors: readonly IAutoMovieSoftBodyResolvedAnchor[];
  /** Resolved body capsules for this step. */
  capsules: readonly IAutoMovieSoftBodyResolvedCapsule[];
}
