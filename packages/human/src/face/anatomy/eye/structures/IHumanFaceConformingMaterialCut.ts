import type { HumanFaceConformingMaterialArithmetic as Arithmetic } from "../HumanFaceConformingMaterialArithmetic";

/**
 * Homogeneous material coordinates with a positive denominator; scale cancels from incidence predicates.
 */
type MaterialPoint = Parameters<typeof Arithmetic.orientation>[0];

/**
 * An original incidence identity paired with its exactly constructed material point.
 *
 *
 * @evidence contracts/common.md#principled-implementation An original vertex/edge-pair key remains separate from its exact homogeneous material coordinate.
 * @evidence contracts/common.md#clear-and-simple-design Canonical polygon/refinement owners construct identities while sheet assembly remaps shared residents.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal coordinates never authorize unregistered identity welding.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes incidence key from exact location and positive-denominator representation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceConformingMaterialCut is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceConformingMaterialCut declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceConformingMaterialCut itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
 *
 * @author Samchon
 */
export interface IHumanFaceConformingMaterialCut {
  /** Original vertex or undirected edge-pair incidence. */
  key: string;

  /** Exact location, independently retained from its identity. */
  point: MaterialPoint;
}
