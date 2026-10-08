import type { IHumanFaceConformingSheetVertex } from "./IHumanFaceConformingSheetVertex";
import type { IHumanFacePeriocularHostSample } from "./IHumanFacePeriocularHostSample";

/**
 * Every original incident face of one refused shared material edge.
 * The output edge, directed incidences, native facets and original grid
 * parents identify the representation the existing boundary check refused.
 * Grid directions retain exact material-area signs; diagnostic coordinates
 * and source seats carry their original construction without another query.
 *
 * @evidence contracts/common.md#principled-implementation Original directed edge incidence and exact grid-area signs distinguish a nonmanifold edge from disagreeing neighboring orientations.
 * @evidence contracts/common.md#clear-and-simple-design One record carries all original incidences of one refused edge.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No face is flipped, selected away or excluded from the original check.
 * @evidence contracts/common.md#meaningful-documentation Separates emitted face ordinals, native facets and original grid parents.
 * @evidence contracts/modeling.md#shared-boundaries Reports the actual edge whose original incident faces could not share a boundary.
 * @evidence contracts/modeling.md#spatial-conventions UVs and grid directions are dimensionless; sample points retain their recorded head-frame metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reports an existing tissue mapping.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no input.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue owner observes the final geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Supplies no anatomical dimension.
 * @evidenceExclude contracts/anatomy.md#permitted-range Changes no permitted range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Contains original output rather than a personal control.
 */
export interface IHumanFaceConformingIncidenceWitness {
  /** Refused incidence class after collecting every original face. */
  reason: "orientation" | "nonmanifold";
  /** Two emitted endpoint ordinals, in canonical undirected order. */
  edge: [number, number];
  /** Every original emitted face incident on this edge. */
  triangles: number[];
  /** Directed endpoint pairs of those same original faces. */
  directions: [number, number][];
  /** Native host facet corresponding to each original emitted face. */
  sourceTriangles: number[];
  /** Original grid triangle corresponding to each emitted face. */
  gridTriangles: [number, number, number][];
  /** Exact signed material-area direction of each original grid triangle. */
  gridDirections: number[];
  /** Original emitted endpoint provenance and source attachment. */
  vertices: IHumanFaceConformingSheetVertex[];
  /** Recorded samples of each original grid triangle. */
  gridSamples: IHumanFacePeriocularHostSample[][];
}
