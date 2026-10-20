import { IAutoMovieConstraintViolation } from "./IAutoMovieConstraintViolation";

/**
 * Result of the engine validation checks actually invoked for an artifact.
 *
 * The success discriminator means no collected error-severity violation; warning-only results retain advice without failing. Failure carries the complete collected violations. Selected Production ingress uses typia's separate data/errors envelope and projects schema findings at its boundary; this record neither shares those fields nor proves that every structural or domain validator ran.
 *
 * @evidence contracts/common.md#principled-implementation toValidation returns failure when any collected item has error severity, success with warnings for a warning-only list and clean success for an empty list.
 * @evidence contracts/common.md#clear-and-simple-design The success discriminator separates a permitted artifact from the complete refusal list while keeping nonblocking advice available.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Warnings are not discarded to manufacture clean success, and failure retains warnings as well as errors from the checks that actually ran.
 * @evidence contracts/common.md#meaningful-documentation Comments define warning-only success, optional warning omission and the failure list; this envelope does not prove that every possible validator ran.
 */
export type IAutoMovieValidation =
  | IAutoMovieValidation.ISuccess
  | IAutoMovieValidation.IFailure;

export namespace IAutoMovieValidation {
  /**
   * No collected error-severity violation.
   *
   * @evidence contracts/common.md#principled-implementation The canonical wrapper reaches this arm only when no collected item is an error; a nonempty warning-only collection is retained under warnings.
   * @evidence contracts/common.md#clear-and-simple-design A true discriminator and optional advice suffice; there is no redundant empty violations list on clean success.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Success denotes the outcome of the invoked checks, not proof that uninvoked geometry, physics or review checks passed.
   * @evidence contracts/common.md#meaningful-documentation The warning member explains nonblocking advice and omission when the collected list is empty.
   */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /**
     * `"warning"`-severity violations that did not block success: physical implausibilities the author may accept or correct. Present only when the run produced warnings; absent when everything was clean.
     */
    warnings?: IAutoMovieConstraintViolation[];
  }

  /**
   * One or more collected violations have error severity.
   *
   * @evidence contracts/common.md#principled-implementation toValidation selects this arm if some item is an error and returns the original collected list in insertion order, including its warnings.
   * @evidence contracts/common.md#clear-and-simple-design One refusal list preserves the evidence needed for correction without parallel error and warning arrays.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failure does not collapse the list to its first error or claim checks after an early refusal were run.
   * @evidence contracts/common.md#meaningful-documentation The false discriminator and list comment explain the nonempty canonical result and inclusion of all tiers that actually ran.
   */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /** Every violation found, across all tiers that ran. Non-empty. */
    violations: IAutoMovieConstraintViolation[];
  }
}
