import type { AutoMovieHumanFacePeriocularStationRole } from "./AutoMovieHumanFacePeriocularStationRole";
import type { IAutoMovieHumanFacePeriocularStationBoundary } from "./IAutoMovieHumanFacePeriocularStationBoundary";

/**
 * One closed host-skin row with explicit source correspondence and authored role.
 *
 * @evidence contracts/common.md#principled-implementation Parallel host-view, canonical source-sample and original native columns preserve distinct identities for one source row; cage admission compares actual resident sample correspondence.
 * @evidence contracts/common.md#clear-and-simple-design One role and aligned column populations describe a coarse station, with an optional complete native boundary owned by its canonical record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The cage checker requires unique aligned columns and valid native IDs but cannot derive licensed original correspondence or histology from a role label; generation/receipt authority remains publisher-owned.
 * @evidence contracts/common.md#meaningful-documentation Compacted source samples versus original native ordinals, shared column order and authored role qualification distinguish each address.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The station record performs no cage comparison or native-boundary traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Column correspondence enables consumers without implementing a posed-row cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Publisher arrays retain no current skin or constructed tissue resources.
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

  /** Optional source-published native course through this same ordered anchor row. */
  boundary?: IAutoMovieHumanFacePeriocularStationBoundary;
}
