import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Indexed resident geometry and its immutable source-ordinal correspondence.
 *
 * Source bookkeeping vertices remain in the original source payload. Every emitted vertex names its original ordinal, including distinct shading aliases at one physical point; this table never welds coordinates or normal islands.
 *
 * @evidence contracts/common.md#principled-implementation Each emitted resident vertex retains its original source ordinal, including shading aliases, so geometry compaction preserves exact provenance without coordinate welding.
 * @evidence contracts/common.md#clear-and-simple-design One result keeps compact mesh, ordinal correspondence and original population count together for source binding consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bookkeeping vertices stay in the source payload, and coincident coordinates or normal islands are never merged to manufacture correspondence.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish referenced resident geometry, resident-to-source mapping and the original population including unreferenced vertices.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The resident-mesh interface describes compaction output while its producer owns the vertex selection algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Original ordinal correspondence is immutable output and does not itself cache equivalent mesh-compaction work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The mesh and ordinal map belong to the producing resident conversion; the type owns no GPU resident or eviction timer.
 * @author Samchon
 */
export interface IHumanBodySourceResidentMesh {
  /** Final aligned geometry containing exactly its referenced vertices. */
  mesh: IAutoMovieMesh;

  /** Resident vertex ordinal to the original acquired/authored source ordinal. */
  sourceVertices: readonly number[];

  /** Original source population, including unreferenced provenance vertices. */
  sourceVertexCount: number;
}
