import type { tessellateAutoMovieLocalHermite64 as T } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieRecoveryByteDigest } from "./IAutoMovieRecoveryByteDigest";
import type { IAutoMovieRecoveryFileReceipt } from "./IAutoMovieRecoveryFileReceipt";
import type { IAutoMovieRecoveryMeshChunkOwner } from "./IAutoMovieRecoveryMeshChunkOwner";
import type { IAutoMovieRecoveryMeshCounts } from "./IAutoMovieRecoveryMeshCounts";

/**
 * Run-owned append-only mesh storage and immutable prefix publication operations.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing publication, ownership and qualification quantities without changing runtime values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One independently named record is shared by its producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration infers no observations, supplies no geometry and changes no admission policy.
 * @evidence contracts/development/common.md#meaningful-documentation Members state byte, population, ownership, presence and qualification meanings.
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
   * @evidence contracts/development/implementation.md#principled-implementation The spool checks finite aligned positions and normals, valid global indices and append-only chunk offsets before writing channels.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One append keeps mesh, physical identities, construction and ownership channels aligned.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No source geometry, fabricated indices or repaired chunk offsets enter the spool.
   * @evidence contracts/development/common.md#meaningful-documentation The chunk uses the engine global index space and the owner binds it to its run.
   * @evidence contracts/development/implementation.md#efficient-algorithms Visits chunk scalar arrays and ownership ranges linearly and writes bounded channel fragments.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the generated chunk once for each required output channel without regenerating geometry.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The run owns staging channels and flushes bounded buffers; appended data are released after writing.
   */
  append: (chunk: T.Chunk, owner: IAutoMovieRecoveryMeshChunkOwner) => void;

  /**
   * Flush all channels and publish a closed journal frontier.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Matching channel populations admit one complete engine-chunk frontier before its immutable journal is written.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One commit binds channel fragments, run context and the previous frontier.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A partial channel population is refused instead of being published as resumable geometry.
   * @evidence contracts/development/common.md#meaningful-documentation The output is a new frontier path and context records caller supplied provenance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Flushes outstanding bounded buffers and visits each new fragment ledger once; work scales with newly persisted bytes and fragments.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Previously committed fragments remain on disk and the journal records only their incremental closure.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Synchronous writers close handles, staging remains run-owned, and the returned receipt is caller-owned.
   */
  commit: (output: string, context: object) => IAutoMovieRecoveryFileReceipt;

  /**
   * Publish an artifact using the same immutable fragment sources.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The artifact writer streams the existing channel fragment bindings after all pending buffers are flushed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One publication shares mesh storage with checkpoints while keeping the output immutable.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The writer does not regenerate geometry or replace missing channel data.
   * @evidence contracts/development/common.md#meaningful-documentation The output path must be unused and the returned receipt binds exact bytes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Publication visits artifact metadata and streams retained fragment bytes once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All channels reuse the same immutable fragment sources without concatenating the full mesh in memory.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous writer closes its handles and transfers the byte digest receipt to the caller.
   */
  publish: (output: string, artifact: object) => IAutoMovieRecoveryByteDigest;
}
