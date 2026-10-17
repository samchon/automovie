import type { V3 } from "../geometry/V3.ts";

/**
 * Describes one ordered reference foot intersection in world millimetres.
 * Closure is implicit; a closed arc does not repeat its first point at the end.
 * An ankle-clipped arc remains open so its endpoints cannot become a surface chord.
 *
 * @evidence contracts/common.md#principled-implementation An ordered polyline and explicit closure preserve the measured intersection's connectivity without introducing a polygon across a missing source interval.
 * @evidence contracts/common.md#clear-and-simple-design Points and closure describe one arc; the source, frame and boundary provenance belong to its observation artifact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This structural record contains no identity, vertex-index catalogue, fitted anatomy or consumer-specific branch.
 * @evidence contracts/common.md#meaningful-documentation States world units, implicit closure and the meaning of an ankle-clipped open arc.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface selects no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased interface computes no reusable work or cache identity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased interface acquires no runtime resources.
 *
 * @author Samchon
 */
export interface FootArc {
  /** Source-order positions in the artifact's shared world frame, in millimetres. */
  points: V3[];

  /** Whether the last source point connects to the first without a missing interval. */
  closed: boolean;
}
