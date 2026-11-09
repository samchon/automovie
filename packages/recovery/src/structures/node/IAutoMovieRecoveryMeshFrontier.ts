import type { IAutoMovieRecoveryFrontierChannel } from "./IAutoMovieRecoveryFrontierChannel";
import type { IAutoMovieRecoveryMeshCounts } from "./IAutoMovieRecoveryMeshCounts";
import type { IAutoMovieRecoveryMetadata } from "./IAutoMovieRecoveryMetadata";

/**
 * Verified closed source-free spool frontier and its exact last context.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing publication, ownership and qualification quantities without changing runtime values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One independently named record is shared by its producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration infers no observations, supplies no geometry and changes no admission policy.
 * @evidence contracts/development/common.md#meaningful-documentation Members state byte, population, ownership, presence and qualification meanings.
 */
export interface IAutoMovieRecoveryMeshFrontier {
  /** Verified generated populations at the closed frontier. */
  counts: IAutoMovieRecoveryMeshCounts;

  /** Exact last committed caller context. */
  context: IAutoMovieRecoveryMetadata;

  /** Verified complete channel bindings. */
  channels: IAutoMovieRecoveryFrontierChannel[];
}
