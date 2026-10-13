import {
  IAutoMovieConstraintViolation,
  IAutoMoviePropSpec,
} from "@automovie/interface";

/**
 * A forged prop: the spec gated on both contracts, ready for staging to place
 * and, when articulated, for `resolveFrame` to constrain and drive through
 * `bindProfile`.
 *
 * @author Samchon
 */
export type IAutoMovieForgedProp =
  | IAutoMovieForgedProp.ISuccess
  | IAutoMovieForgedProp.IFailure;

export namespace IAutoMovieForgedProp {
  /** The prop passed the model and articulation contracts. */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /** The accepted spec, echoed for the staging join. */
    prop: IAutoMoviePropSpec;
  }

  /**
   * The spec broke a contract; every violation listed for the correction round.
   */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /** Every violation found, for the correction round. */
    violations: IAutoMovieConstraintViolation[];
  }
}
