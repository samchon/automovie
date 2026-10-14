import type { IHumanFaceConformingSheetVertex } from "./IHumanFaceConformingSheetVertex";
import type { IHumanFacePeriocularHostSample } from "./IHumanFacePeriocularHostSample";

/**
 * Every original incident face of one refused shared material edge.
 * The output edge, directed incidences, native facets and original grid
 * parents identify the representation the existing boundary check refused.
 * Grid directions retain exact material-area signs; diagnostic coordinates
 * and source seats carry their original construction without another query.
 *
 * @evidence contracts/common.md#principled-implementation Every refused edge's original directed faces retain output/native/grid parents and exact area-direction meaning.
 * @evidence contracts/common.md#clear-and-simple-design createHumanFaceConformingSheet owns collection after unchanged incidence predicates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Witnesses add no second geometry query or coordinate repair and cannot imply complete physical admission.
 * @evidence contracts/common.md#meaningful-documentation Fields identify all incident faces, undirected edge, parent ordinals and original samples.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceConformingIncidenceWitness is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceConformingIncidenceWitness declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceConformingIncidenceWitness itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
 *
 * @author Samchon
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
