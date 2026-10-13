import {
  IAutoMovieBeatEndState,
  IAutoMovieBlocking,
  IAutoMovieConstraintViolation,
} from "@automovie/interface";

/**
 * A validated blocking: the beat's shot plan, coherent with the script and the
 * staged world, ready to steer the performance stage.
 *
 * @author Samchon
 */
export type IAutoMovieBlockedBeat =
  | IAutoMovieBlockedBeat.ISuccess
  | IAutoMovieBlockedBeat.IFailure;

export namespace IAutoMovieBlockedBeat {
  /** The plan holds together; performance can align to it. */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /** The validated plan, verbatim. */
    blocking: IAutoMovieBlocking;

    /**
     * The validated initial condition from the prior beat, or `null` for the
     * first beat (or when none was supplied). Surfaced so the performance stage
     * seeds each actor's start position, facing, articulation, gait phase,
     * velocity, plants, and mount from where the previous beat actually ended.
     */
    previous: IAutoMovieBeatEndState | null;
  }

  /** The plan contradicted the script, the stage, or its own timeline. */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /** Every contradiction found, for the correction round. */
    violations: IAutoMovieConstraintViolation[];
  }
}
