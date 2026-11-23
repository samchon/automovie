import type { IAutoMovieShot } from "../cinematics/IAutoMovieShot";
import type { IAutoMovieBeatEndFootPlant } from "../harness/IAutoMovieBeatEndFootPlant";
import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieConstraintViolation } from "../validation/IAutoMovieConstraintViolation";

/**
 * What `performShot` returns: the assembled {@link IAutoMovieShot} with the
 * dense motion clips the synthesizer produced for it, or every violation that
 * stopped the performance at its first failing gate group.
 *
 * The clips travel beside the shot because the shot references them by id and
 * the host registers them in whatever clip store it keeps.
 */
export type IAutoMoviePerformedShot =
  | IAutoMoviePerformedShot.ISuccess
  | IAutoMoviePerformedShot.IFailure;

/** Data and callback contracts shared by the PerformedShot operations. */
export namespace IAutoMoviePerformedShot {
  /**
   * The performance compiled, every clip passed `validateMotion`, and the
   * assembled shot passed the shot artifact contract.
   */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /** The assembled shot, ready for the cut. */
    shot: IAutoMovieShot;

    /**
     * The synthesized clip per performing scene node, keyed by node id. A
     * planted actor's entry is its stance-planted clip.
     */
    motions: Record<string, IAutoMovieMotion>;

    /**
     * World-space foot-plant runs, one entry per actor whose motion carries a
     * gait cycle or resumed opening plants and whose rig has recognized feet,
     * ordered by node id.
     */
    plants: Array<{
      /** Scene node owning these plant runs. */
      node: string;

      /** This shot's stance runs, carried into the next beat's opening. */
      plants: IAutoMovieBeatEndFootPlant[];
    }>;
  }

  /**
   * The action list contradicted the staged world, blocking or runtime
   * capabilities, or a compiled clip broke its rig's range of motion; no shot
   * was assembled. The list holds every violation of the first gate group that
   * failed; later gates did not run.
   */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /**
     * Every violation of the failing gate group, with paths into the
     * performance input (`$input...`) or a synthesized clip
     * (`$compiled["<node>"]...`).
     */
    violations: IAutoMovieConstraintViolation[];
  }
}
