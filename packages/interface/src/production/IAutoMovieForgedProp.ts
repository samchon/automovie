import type { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";
import type { IAutoMovieConstraintViolation } from "../validation/IAutoMovieConstraintViolation";

/**
 * What `forgeProp` returns: the spec gated on its model and articulation
 * contracts, ready for staging to place and, when articulated, for
 * `resolveFrame` to constrain and drive through `bindProfile`; or every
 * violation the spec carried.
 */
export type IAutoMovieForgedProp =
  | IAutoMovieForgedProp.ISuccess
  | IAutoMovieForgedProp.IFailure;

/** Data and callback contracts shared by the ForgedProp operations. */
export namespace IAutoMovieForgedProp {
  /**
   * The prop passed the model contract (id equals node, origin and imported
   * closure coherent, no skeleton, `validateModel` clean) and, when present,
   * the articulation contract.
   */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /**
     * The accepted spec, the same object the caller passed, for the staging
     * join.
     */
    prop: IAutoMoviePropSpec;
  }

  /**
   * The spec broke a contract; every violation is listed for the correction
   * round and no prop was accepted.
   */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /** Every violation found, with paths into the spec (`$input...`). */
    violations: IAutoMovieConstraintViolation[];
  }
}
