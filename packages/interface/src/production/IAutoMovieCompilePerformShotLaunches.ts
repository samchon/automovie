import type { IAutoMovieInteractionEvent } from "../cinematics/IAutoMovieInteractionEvent";
import type { IAutoMovieClip } from "../core/IAutoMovieClip";

/** Baked projectile clips and interaction events returned from the launch stage. */
export namespace IAutoMovieCompilePerformShotLaunches {
  /**
   * Mutable successful flight artifacts in launch-job order. Unreachable or
   * late flights add a range violation to the caller's collector and contribute
   * no clip or event; the result alone does not certify stage success.
   */
  export type IResult = {
    /**
     * New array of baked projectile clips on the shot-local clock. Later
     * flights of a projectile receive occurrence suffixes; before the first
     * key, earlier channel authority or staged placement remains in charge.
     */
    clips: IAutoMovieClip[];
    /**
     * New array of accepted launches' interaction events with original
     * actionIndex. Events remain in launch-job order here; performShot sorts
     * the assembled shot's event list later.
     */
    events: IAutoMovieInteractionEvent[];
  };
}
