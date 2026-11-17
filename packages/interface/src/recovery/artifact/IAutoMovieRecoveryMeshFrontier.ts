import type {
  IAutoMovieRecoveryFrontierChannel,
  IAutoMovieRecoveryMeshCounts,
  IAutoMovieRecoveryMetadata,
} from "../../index";

/**
 * Verified closed source-free spool frontier and its exact last context.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Verified generated populations at the closed frontier. Exact last committed caller context.
 * @evidence contracts/development/design.md#principled-representation Verified closed source-free spool frontier and its exact last context.
 * @evidence contracts/development/design.md#minimal-and-owned-surface readAutoMovieRecoveryMeshFrontier share IAutoMovieRecoveryMeshFrontier's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryMeshFrontier {
  /** Verified generated populations at the closed frontier. */
  counts: IAutoMovieRecoveryMeshCounts;

  /** Exact last committed caller context. */
  context: IAutoMovieRecoveryMetadata;

  /** Verified complete channel bindings. */
  channels: IAutoMovieRecoveryFrontierChannel[];
}
