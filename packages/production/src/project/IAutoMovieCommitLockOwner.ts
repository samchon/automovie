import { type IAutoMovieLocalProcessOwner } from "./IAutoMovieLocalProcessOwner";

/**
 * A validated host/PID/process-generation identity with its recorded acquisition time in epoch milliseconds. Time explains a refusal but never proves that the owner died.
 *
 * @evidence contracts/common.md#principled-implementation Extends the canonical local-process identity instead of restating its fields; the token parser separately admits a nonnegative safe acquisition timestamp.
 * @evidence contracts/common.md#clear-and-simple-design Adds only acquisition time to the shared owner representation, leaving current process-state observation and token equality to their respective owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type does not authorize age-based reclamation or validate untyped JSON; parsing and process observation remain required runtime boundaries.
 * @evidence contracts/common.md#meaningful-documentation States epoch-millisecond units and the non-authoritative role of time beside host/PID/generation identity.
 * @evidence contracts/performance.md#efficient-algorithms This interface performs no computation; token serialization and parsing account for owner field lengths at their operation owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the established local-process owner structure; this interface creates neither an identity cache nor an observation result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owner records contain scalar identity fields and no handles; token and survey callers own their record retention, with no lifetime mechanism supplied by this type.
 * @author Samchon
 */
export interface IAutoMovieCommitLockOwner extends IAutoMovieLocalProcessOwner {
  /** When the lock was taken, in epoch milliseconds. */
  at: number;
}
