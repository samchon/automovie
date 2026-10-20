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

  /** Append one admitted globally indexed engine chunk. */
  append: (chunk: T.Chunk, owner: IAutoMovieRecoveryMeshChunkOwner) => void;

  /** Flush all channels and publish a closed journal frontier. */
  commit: (output: string, context: object) => IAutoMovieRecoveryFileReceipt;

  /** Publish an artifact using the same immutable fragment sources. */
  publish: (output: string, artifact: object) => IAutoMovieRecoveryByteDigest;
}
