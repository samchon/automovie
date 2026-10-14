import type { IAutoMovieLocalProcessOwner } from "./IAutoMovieLocalProcessOwner";



/**
 * What local process-table evidence proves about a persisted lock owner.
 *
 * @evidence contracts/common.md#principled-implementation The closed states distinguish exact current generation, proved absence, uncertain occupancy, foreign host and unavailable evidence.
 * @evidence contracts/common.md#clear-and-simple-design observeAutoMovieLocalProcessOwner owns observation; commit-lock recovery consumes the distinction without promoting occupancy into identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only absent evidence proves a recorded PID unoccupied; unknown, elsewhere and reused occupancy do not authorize dead-owner recovery.
 * @evidence contracts/common.md#meaningful-documentation States each proof strength and sanitized unknown reasons.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This union performs no query; the observer owns its constant-size comparison and signal-zero probe.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type defines no observation cache because process occupancy can change between queries.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Each result references a validated descriptor until its caller releases it and owns no process handle.
 */
export type AutoMovieLocalProcessOwnerObservation =
  | {
      /** The descriptor is exactly this observing process generation. */
      state: "same-owner";
      /** The validated persisted owner. */
      owner: IAutoMovieLocalProcessOwner;
    }
  | {
      /** No process currently occupies the recorded local PID. */
      state: "absent";
      /** The validated persisted owner. */
      owner: IAutoMovieLocalProcessOwner;
    }
  | {
      /** The PID is occupied without proof that its process generation matches. */
      state: "occupied-or-reused";
      /** The validated persisted owner. */
      owner: IAutoMovieLocalProcessOwner;
    }
  | {
      /** The descriptor belongs to a host this process table cannot inspect. */
      state: "elsewhere";
      /** The validated persisted owner. */
      owner: IAutoMovieLocalProcessOwner;
    }
  | {
      /** No recovery-authorizing owner conclusion could be proved. */
      state: "unknown";
      /** A validated owner when the observation, rather than parsing, failed. */
      owner: IAutoMovieLocalProcessOwner | null;
      /** Sanitized reason that does not expose the raw descriptor or platform error. */
      reason: "invalid-owner" | "process-query-unavailable";
    };
