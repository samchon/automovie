import type { IAutoMovieRecoveryCompleted } from "../structures/operation/IAutoMovieRecoveryCompleted";
import type { IAutoMovieRecoveryTerminated } from "../structures/operation/IAutoMovieRecoveryTerminated";

/**
 * Discriminated outcome; only a completed or partial operation carries a value.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve recorded quantities, units and terminal-state meaning.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One independently named contract is shared by its actual producers and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration supplies no computation, inferred observation or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members document quantity, identity and absence semantics.
 */
export type IAutoMovieRecoveryResult<T> =
  | IAutoMovieRecoveryCompleted<T>
  | IAutoMovieRecoveryTerminated;
