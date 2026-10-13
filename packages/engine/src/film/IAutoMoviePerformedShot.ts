import {
  IAutoMovieBeatEndFootPlant,
  IAutoMovieConstraintViolation,
  IAutoMovieMotion,
  IAutoMovieShot,
} from "@automovie/interface";

/**
 * A performed shot: the assembled {@link IAutoMovieShot} plus the dense motion
 * clips the builder synthesised for it. The clips travel alongside the shot
 * because the shot references them by id, the host registers them wherever its
 * clip store lives.
 *
 * @author Samchon
 */
export type IAutoMoviePerformedShot =
  | IAutoMoviePerformedShot.ISuccess
  | IAutoMoviePerformedShot.IFailure;

export namespace IAutoMoviePerformedShot {
  /** The performance compiled and every clip passed validation. */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /** The shot, ready for the cut. */
    shot: IAutoMovieShot;

    /** The synthesised per-actor clips, keyed by scene-node id. */
    motions: Record<string, IAutoMovieMotion>;

    /** Ground-IK stance runs produced for gait or resumed opening plants. */
    plants: Array<{
      /** Scene node owning these world-space plant runs. */
      node: string;
      /** Current-shot stance runs carried into the next beat. */
      plants: IAutoMovieBeatEndFootPlant[];
    }>;
  }

  /** The action list contradicted the stage, or a compiled clip broke ROM. */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /** Every violation found, for the correction round. */
    violations: IAutoMovieConstraintViolation[];
  }
}
