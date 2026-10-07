import type { AutoMovieHumanFacePeriocularStationRole } from "./AutoMovieHumanFacePeriocularStationRole";

/** One closed host-skin row with explicit source correspondence and authored role.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularStation {
  /** Section role is an authoring convention, not a histological observation. */
  role: AutoMovieHumanFacePeriocularStationRole;
  /** Host surface indices, with identical column order across all stations. */
  vertices: number[];
  /** Canonical source-tree sample IDs for those view columns; independent of original native ordinals after compaction. */
  sourceVertices: number[];
  /** Original licensed source indices corresponding to those same columns. */
  nativeVertices: number[];
}
