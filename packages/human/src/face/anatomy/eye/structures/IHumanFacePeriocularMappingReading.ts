import type { IHumanFacePeriocularOffsetWitnesses } from "./IHumanFacePeriocularOffsetWitnesses";

/** Mathematical readings of the actual emitted band; none is clinical acceptance.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularMappingReading {
  /** Source sheet triangle count after the declared pole quotient. */
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
