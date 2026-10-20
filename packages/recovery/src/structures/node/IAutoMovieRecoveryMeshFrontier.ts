import type { IAutoMovieRecoveryFrontierChannel } from "./IAutoMovieRecoveryFrontierChannel";
import type { IAutoMovieRecoveryMeshCounts } from "./IAutoMovieRecoveryMeshCounts";
import type { IAutoMovieRecoveryMetadata } from "./IAutoMovieRecoveryMetadata";

/**
 * Verified closed source-free spool frontier and its exact last context.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing publication, ownership and qualification quantities without changing runtime values.
 * @evidence contracts/common.md#clear-and-simple-design One independently named record is shared by its producer and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration infers no observations, supplies no geometry and changes no admission policy.
 * @evidence contracts/common.md#meaningful-documentation Members state byte, population, ownership, presence and qualification meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Its runtime owner controls publication and computational reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records remain caller-owned and the type acquires no resource handle.
 */
export interface IAutoMovieRecoveryMeshFrontier {
  /** Verified generated populations at the closed frontier. */
  counts: IAutoMovieRecoveryMeshCounts;

  /** Exact last committed caller context. */
  context: IAutoMovieRecoveryMetadata;

  /** Verified complete channel bindings. */
  channels: IAutoMovieRecoveryFrontierChannel[];
}
