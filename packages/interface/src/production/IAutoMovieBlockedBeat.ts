import type { IAutoMovieBlocking } from "../authoring/IAutoMovieBlocking";
import type { IAutoMovieBeatEndState } from "../harness/IAutoMovieBeatEndState";
import type { IAutoMovieConstraintViolation } from "../validation/IAutoMovieConstraintViolation";

/**
 * The result of `blockBeat`: either a validated blocking, the beat's shot plan
 * coherent with the script and the staged world and ready to steer the
 * performance stage, or every contradiction found in it.
 */
export type IAutoMovieBlockedBeat =
  | IAutoMovieBlockedBeat.ISuccess
  | IAutoMovieBlockedBeat.IFailure;

/** Data and callback contracts shared by the BlockedBeat operations. */
export namespace IAutoMovieBlockedBeat {
  /** The plan holds together; performance can align to it. */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /** The validated plan, the same object the caller passed in. */
    blocking: IAutoMovieBlocking;

    /**
     * The validated initial condition from the prior beat, the same object the
     * caller passed, or `null` when none was supplied, as for a first beat. The
     * performance stage seeds each actor's start position, facing,
     * articulation, gait phase, velocity, plants, and mount from it, so the
     * beat resumes where the previous one actually ended.
     */
    previous: IAutoMovieBeatEndState | null;
  }

  /** The plan contradicted the script, the stage, or its own timeline. */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /** Every contradiction found, in check order, for the correction round. */
    violations: IAutoMovieConstraintViolation[];
  }
}
