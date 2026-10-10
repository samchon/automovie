import type { IHumanFaceConformingSheetVertex } from "./IHumanFaceConformingSheetVertex";
import type { IHumanFacePeriocularHostSample } from "./IHumanFacePeriocularHostSample";

/**
 * Every original incident face of one refused shared material edge.
 * The output edge, directed incidences, native facets and original grid
 * parents identify the representation the existing boundary check refused.
 * Grid directions retain exact material-area signs; diagnostic coordinates
 * and source seats carry their original construction without another query.
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
