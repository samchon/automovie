import type { tessellateAutoMovieLocalHermite64 as T } from "@automovie/engine/geometry/curve";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieRecoveryByteDigest } from "./IAutoMovieRecoveryByteDigest";
import type { IAutoMovieRecoveryFileReceipt } from "./IAutoMovieRecoveryFileReceipt";
import type { IAutoMovieRecoveryMeshChunkOwner } from "./IAutoMovieRecoveryMeshChunkOwner";
import type { IAutoMovieRecoveryMeshCounts } from "./IAutoMovieRecoveryMeshCounts";

/**
 * Run-owned append-only mesh storage and immutable prefix publication operations.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing publication, ownership and qualification quantities without changing runtime values.
 * @evidence contracts/common.md#clear-and-simple-design One independently named record is shared by its producer and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration infers no observations, supplies no geometry and changes no admission policy.
 * @evidence contracts/common.md#meaningful-documentation Members state byte, population, ownership, presence and qualification meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Its runtime owner controls publication and computational reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records remain caller-owned and the type acquires no resource handle.
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

  /**
   * Append one admitted globally indexed engine chunk.
   *
   * @evidence contracts/common.md#principled-implementation The spool checks finite aligned positions and normals, valid global indices and append-only chunk offsets before writing channels.
   * @evidence contracts/common.md#clear-and-simple-design One append keeps mesh, physical identities, construction and ownership channels aligned.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No source geometry, fabricated indices or repaired chunk offsets enter the spool.
   * @evidence contracts/common.md#meaningful-documentation The chunk uses the engine global index space and the owner binds it to its run.
   * @evidence contracts/performance.md#efficient-algorithms Visits chunk scalar arrays and ownership ranges linearly and writes bounded channel fragments.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the generated chunk once for each required output channel without regenerating geometry.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The run owns staging channels and flushes bounded buffers; appended data are released after writing.
   */
  append: (chunk: T.Chunk, owner: IAutoMovieRecoveryMeshChunkOwner) => void;

  /**
   * Flush all channels and publish a closed journal frontier.
   *
   * @evidence contracts/common.md#principled-implementation Matching channel populations admit one complete engine-chunk frontier before its immutable journal is written.
   * @evidence contracts/common.md#clear-and-simple-design One commit binds channel fragments, run context and the previous frontier.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A partial channel population is refused instead of being published as resumable geometry.
   * @evidence contracts/common.md#meaningful-documentation The output is a new frontier path and context records caller supplied provenance.
   * @evidence contracts/performance.md#efficient-algorithms Flushes outstanding bounded buffers and visits each new fragment ledger once; work scales with newly persisted bytes and fragments.
   * @evidence contracts/performance.md#reuse-equivalent-work Previously committed fragments remain on disk and the journal records only their incremental closure.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous writers close handles, staging remains run-owned, and the returned receipt is caller-owned.
   */
  commit: (output: string, context: object) => IAutoMovieRecoveryFileReceipt;

  /**
   * Publish an artifact using the same immutable fragment sources.
   *
   * @evidence contracts/common.md#principled-implementation The artifact writer streams the existing channel fragment bindings after all pending buffers are flushed.
   * @evidence contracts/common.md#clear-and-simple-design One publication shares mesh storage with checkpoints while keeping the output immutable.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The writer does not regenerate geometry or replace missing channel data.
   * @evidence contracts/common.md#meaningful-documentation The output path must be unused and the returned receipt binds exact bytes.
   * @evidence contracts/performance.md#efficient-algorithms Publication visits artifact metadata and streams retained fragment bytes once.
   * @evidence contracts/performance.md#reuse-equivalent-work All channels reuse the same immutable fragment sources without concatenating the full mesh in memory.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous writer closes its handles and transfers the byte digest receipt to the caller.
   */
  publish: (output: string, artifact: object) => IAutoMovieRecoveryByteDigest;
}
