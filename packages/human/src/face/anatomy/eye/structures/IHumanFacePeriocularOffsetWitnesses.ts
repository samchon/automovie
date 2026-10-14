import type { IHumanFacePeriocularCrossingWitness } from "./IHumanFacePeriocularCrossingWitness";
import type { IHumanFacePeriocularOffsetVertex } from "./IHumanFacePeriocularOffsetVertex";

/**
 * Original instrument witnesses; this adds no measurement or admission rule.
 * The actual requested distances and retained skin frames identify the
 * normal-offset map whose generated triangles the instrument inspected.
 *
 *
 * @evidence contracts/common.md#principled-implementation Original outer/inner/between crossing witnesses retain requested distances and the union of actual producer frames.
 * @evidence contracts/common.md#clear-and-simple-design The mapping owner attaches existing instrument results to their unchanged normal-offset inputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Witness collection adds no measurement, new query or physical acceptance rule.
 * @evidence contracts/common.md#meaningful-documentation Fields state metric distances, all three relation populations and once-per-identity retained corners.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFacePeriocularOffsetWitnesses is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFacePeriocularOffsetWitnesses declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFacePeriocularOffsetWitnesses acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularOffsetWitnesses {
  /** Requested outer-sheet inward distance, metres. */
  outerDistanceMetres: number;

  /** Requested inner-sheet inward distance, metres. */
  innerDistanceMetres: number;

  /** Original outer-versus-outer transverse witnesses. */
  outer: IHumanFacePeriocularCrossingWitness[];

  /** Original inner-versus-inner transverse witnesses. */
  inner: IHumanFacePeriocularCrossingWitness[];

  /** Original outer-versus-inner transverse witnesses. */
  between: IHumanFacePeriocularCrossingWitness[];

  /** Producer frames for the union of all witness corners, once per identity. */
  vertices: IHumanFacePeriocularOffsetVertex[];
}
