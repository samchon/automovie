import type {
  IAutoMovieByteDigest,
  IAutoMovieFileReceipt,
  IAutoMovieLocalHermiteStream64,
  IAutoMovieMesh,
  IAutoMovieRecoveryMeshChunkOwner,
  IAutoMovieRecoveryMeshCounts,
} from "../../index";

/**
 * Run-owned append-only mesh channels and immutable prefix publication ports.
 * The exposed arrays are identity placeholders: createAutoMovieRecoveryMeshSpool
 * keeps generated values in pending buffers and persisted fragments, and publish
 * substitutes those fragments when serializing these exact array objects.
 * Consumers must not treat their empty resident lengths as the mesh population;
 * counts is the live mutable population record. Pending channels are bounded,
 * while fragment/frontier descriptors and immutable lineage files grow with output.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States placeholder identity, live counts, append-only indexing, publication ownership and retained lineage lifetime.
 * @evidence contracts/development/design.md#principled-representation One spool binds mesh, construction and ownership placeholders to aligned generated channels; global vertex indices survive chunk and run boundaries.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The reconstruction host uses append for generation, commit for incremental frontiers and publish for a standalone artifact, sharing the same immutable fragments.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record does not materialize missing geometry or certify resumability; numeric chunk admission belongs to append, and generator replay needs separate verification.
 */

export interface IAutoMovieRecoveryMeshSpool {
  /** Append-only generated mesh placeholders. */
  mesh: IAutoMovieMesh;

  /** Generated construction placeholders backed by persisted fragments. */
  construction: object[];

  /** Generated domain ownership placeholders. */
  ownership: object[];

  /** Current appended populations. */
  counts: IAutoMovieRecoveryMeshCounts;

  /** Append one admitted globally indexed engine chunk.
   * @evidence contracts/development/common.md#meaningful-documentation The chunk uses the engine global index space and the owner binds it to its run.
   */
  append: (
    chunk: IAutoMovieLocalHermiteStream64.Chunk,
    owner: IAutoMovieRecoveryMeshChunkOwner,
  ) => void;

  /** Flush all channels and publish a closed journal frontier.
   * @evidence contracts/development/common.md#meaningful-documentation The output is a new frontier path and context records caller supplied provenance.
   */
  commit: (output: string, context: object) => IAutoMovieFileReceipt;

  /** Publish an artifact using the same immutable fragment sources.
   * @evidence contracts/development/common.md#meaningful-documentation The output path must be unused and the returned receipt binds exact bytes.
   */
  publish: (output: string, artifact: object) => IAutoMovieByteDigest;
}
