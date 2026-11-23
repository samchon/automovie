import type { IAutoMovieConstraintViolation } from "./IAutoMovieConstraintViolation";

/**
 * Result of the engine validation checks actually invoked for an artifact.
 *
 * The success discriminator means no collected error-severity violation;
 * warning-only results retain advice without failing. Failure carries the
 * complete collected violations. Selected Production ingress uses typia's
 * separate data/errors envelope and projects schema findings at its boundary;
 * this record neither shares those fields nor proves that every structural or
 * domain validator ran.
 */
export type IAutoMovieValidation =
  | IAutoMovieValidation.ISuccess
  | IAutoMovieValidation.IFailure;

/** Success and failure envelopes for the checks that actually ran. */
export namespace IAutoMovieValidation {
  /** No collected error-severity violation. */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /**
     * `"warning"`-severity violations that did not block success: physical
     * implausibilities the author may accept or correct. Present only when the
     * run produced warnings; absent when everything was clean.
     */
    warnings?: IAutoMovieConstraintViolation[];
  }

  /** One or more collected violations have error severity. */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /** Every violation found, across all tiers that ran. Non-empty. */
    violations: IAutoMovieConstraintViolation[];
  }
}
