import type {
  IAutoMovieRecoveryCompleted,
  IAutoMovieRecoveryTerminated,
} from "../../index";

/**
 * Discriminated outcome; only a completed or partial operation carries a value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation
 * @evidence contracts/development/design.md#principled-representation Discriminated outcome; only a completed or partial operation carries a value.
 * @evidence contracts/development/design.md#minimal-and-owned-surface compileAutoMovieRecoveryImageLoft, compileAutoMovieRecoverySupportLoft, fitAutoMovieRecoveryImageLoft share IAutoMovieRecoveryResult's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export type IAutoMovieRecoveryResult<T> =
  | IAutoMovieRecoveryCompleted<T>
  | IAutoMovieRecoveryTerminated;
