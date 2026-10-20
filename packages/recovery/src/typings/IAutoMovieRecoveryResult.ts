import type { IAutoMovieRecoveryCompleted } from "../structures/operation/IAutoMovieRecoveryCompleted";
import type { IAutoMovieRecoveryTerminated } from "../structures/operation/IAutoMovieRecoveryTerminated";

/**
 * Discriminated outcome; only a completed or partial operation carries a value.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve recorded quantities, units and terminal-state meaning.
 * @evidence contracts/common.md#clear-and-simple-design One independently named contract is shared by its actual producers and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration supplies no computation, inferred observation or fallback.
 * @evidence contracts/common.md#meaningful-documentation Members document quantity, identity and absence semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased contract performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Data belong to the caller and acquire no resources.
 */
export type IAutoMovieRecoveryResult<T> =
  | IAutoMovieRecoveryCompleted<T>
  | IAutoMovieRecoveryTerminated;
