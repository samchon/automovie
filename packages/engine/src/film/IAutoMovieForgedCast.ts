import {
  IAutoMovieConstraintViolation,
  IAutoMovieModel,
} from "@automovie/interface";

/**
 * A forged cast: every stand-in rig validated and keyed by the cast node it
 * embodies, ready for the staged scene's `modelRef ?? node` join.
 *
 * @author Samchon
 */
export type IAutoMovieForgedCast =
  | IAutoMovieForgedCast.ISuccess
  | IAutoMovieForgedCast.IFailure;

export namespace IAutoMovieForgedCast {
  /** Every stand-in exists, joins its cast member, and passed validation. */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /** Validated stand-ins, keyed by cast node id. */
    models: Record<string, IAutoMovieModel>;
  }

  /** The forge contradicted the script or a rig failed validation. */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /** Every violation found, for the correction round. */
    violations: IAutoMovieConstraintViolation[];
  }
}
