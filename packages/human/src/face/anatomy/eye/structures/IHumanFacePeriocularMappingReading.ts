import type { IHumanFacePeriocularOffsetWitnesses } from "./IHumanFacePeriocularOffsetWitnesses";

/** Mathematical readings of the actual emitted band; none is clinical acceptance.
 * Crossing counts retain at most one transverse witness per first triangle,
 * rather than counting every intersecting face pair.
 *
 *
 * @evidence contracts/common.md#principled-implementation Material area signs and published spatial crossing observations separately describe the actual emitted band.
 * @evidence contracts/common.md#clear-and-simple-design The mapping reader owns existing instruments while physical admission remains with tissue-space readers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null material means legacy unknown; observed witnesses do not introduce clinical acceptance or a new tolerance.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish signed UV counts, actual crossing readings, sampled host ordinals and optional original witnesses.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFacePeriocularMappingReading is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFacePeriocularMappingReading declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFacePeriocularMappingReading acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularMappingReading {
  /** Actual conforming triangle count, or the structured sheet count after its declared endpoint quotient. */
  triangles: number;

  /** Signed dimensionless UV areas, or null for a legacy unregistered band. */
  positiveMaterialTriangles: number | null;

  /** Oppositely oriented material triangles, without an epsilon classification. */
  negativeMaterialTriangles: number | null;

  /** Exactly zero material areas, excluding repeated-index pole triangles. */
  zeroMaterialTriangles: number | null;

  /** Float32 transverse crossings of the actual sampled skin sheet. */
  skinSheetCrossings: number;

  /** Float32 transverse crossings within the actual outer offset sheet. */
  outerSheetCrossings: number;

  /** Float32 transverse crossings within the actual inner offset sheet. */
  innerSheetCrossings: number;

  /** Float32 transverse crossings between the two offset sheets. */
  betweenSheetCrossings: number;

  /** Actual host triangle ordinals read by the source samples; not the entire source patch. */
  sampledSourceTriangles: number[];

  /** Original crossing witnesses with actual attachments, absent for legacy grids. */
  offsetWitnesses?: IHumanFacePeriocularOffsetWitnesses;
}
