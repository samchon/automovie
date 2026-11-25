import type {
  IAutoMovieRecoveryFrontierChannel,
  IAutoMovieRecoveryMeshCounts,
  IAutoMovieRecoveryMetadata,
} from "../../index";

/** Verified closed source-free spool frontier and its exact last context. */

export interface IAutoMovieRecoveryMeshFrontier {
  /** Verified generated populations at the closed frontier. */
  counts: IAutoMovieRecoveryMeshCounts;

  /** Exact last committed caller context. */
  context: IAutoMovieRecoveryMetadata;

  /** Verified complete channel bindings. */
  channels: IAutoMovieRecoveryFrontierChannel[];
}
