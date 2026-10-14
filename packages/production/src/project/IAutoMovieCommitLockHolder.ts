import type { IAutoMovieCommitLockOwner } from "./IAutoMovieCommitLockOwner";
import type { AutoMovieCommitLockOwnerState } from "./AutoMovieCommitLockOwnerState";

/**
 * A current lock survey: a validated owner accompanies established states, while unknown retains an optional readable owner and a sanitized failure category. The path identifies the surveyed coordinate, not a held lease.
 *
 * @evidence contracts/common.md#principled-implementation The union requires an owner for non-unknown states and distinguishes invalid token, unreadable lock and unavailable process observation in the unknown arm.
 * @evidence contracts/common.md#clear-and-simple-design Carries only facts needed by holder descriptions and reclaim checks; opened-file token/identity stay in the separate private snapshot record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing or readable-but-unobserved owner is explicit rather than represented as dead, and the type alone grants no filesystem mutation authority.
 * @evidence contracts/common.md#meaningful-documentation Documents surveyed path, owner/state pairing and sanitized unknown reasons without exposing native error text as ownership proof.
 * @evidence contracts/performance.md#efficient-algorithms The type performs no survey; the snapshot reader and process observer account for token-byte and native-query work.
 * @evidence contracts/performance.md#reuse-equivalent-work Callers can share one holder record within a refusal; this type defines no cross-survey identity cache or invalidation policy.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains path and scalar owner values only; no descriptor or lock acquisition transfers through this holder observation.
 */
export type IAutoMovieCommitLockHolder =
  | {
      /** The lock file inspected. */
      path: string;

      /** The owner the file records. */
      owner: IAutoMovieCommitLockOwner;

      /** What can be proven about that owner. */
      state: Exclude<AutoMovieCommitLockOwnerState, "unknown">;
    }
  | {
      /** The lock file inspected. */
      path: string;

      /** Validated owner when only its process observation failed. */
      owner: IAutoMovieCommitLockOwner | null;

      /** Nothing can be proven, so nothing is authorized. */
      state: "unknown";

      /** Sanitized failure class for a target-safe refusal. */
      reason:
        | "invalid-owner"
        | "lock-read-unavailable"
        | "process-query-unavailable";
    };
