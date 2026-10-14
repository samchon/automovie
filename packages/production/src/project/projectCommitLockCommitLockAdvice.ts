import type { AutoMovieCommitLockOwnerState } from "./AutoMovieCommitLockOwnerState";

/**
 * Operator advice for every closed holder state; it does not grant the caller extra authority. An absent state still needs the owning operation's exact resident-file transfer checks.
 */
export const projectCommitLockCommitLockAdvice: Record<AutoMovieCommitLockOwnerState, string> = {
  "same-owner": "retry after this process finishes its owning operation",
  "occupied-or-reused":
    "retry shortly; PID occupancy does not authorize reclaim",
  absent:
    "it should have been reclaimed automatically, so if this repeats, remove that file",
  elsewhere:
    "retry shortly, and if it never frees, verify on that host that no AutoMovie commit is running and remove that lock file manually",
  unknown:
    "retry shortly, or if a crashed process left it behind, verify that no AutoMovie commit is running and remove that lock file manually",
};
