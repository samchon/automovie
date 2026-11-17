import type { IAutoMovieInteractionEvent } from "../cinematics/IAutoMovieInteractionEvent";
import type { IAutoMovieClip } from "../core/IAutoMovieClip";

/**
 * Baked projectile clips and interaction events returned from the launch stage.
 */
export namespace IAutoMovieCompilePerformShotLaunches {
  /**
   * Mutable successful flight artifacts in launch-job order. Unreachable or late flights add a range violation to the caller's collector and contribute no clip or event; the result alone does not certify stage success.
   *
   * @evidence contracts/development/design.md#principled-representation Clip key times and event times use shot-local seconds; clips span the full shot and flight keys begin at action.start. actionIndex preserves the originating launch's position.
   * @evidence contracts/development/design.md#minimal-and-owned-surface compilePerformShotLaunches produces these mutable arrays for performShot to append later object clips and coupling events before final event sorting.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The result can contain successful launches while the context collector contains failures; performShot refuses that stage as a whole. Recoil actions are appended to the action plan rather than hidden inside this result.
   * @evidence contracts/development/common.md#meaningful-documentation Baked projectile clips and interaction events returned from the launch stage. Clip key times and event times use shot-local seconds; clips span the full shot and flight keys begin at action.start. actionIndex preserves the originating launch's position.
   */
  export type IResult = {
    /**
     * New array of baked projectile clips on the shot-local clock. Later flights of a projectile receive occurrence suffixes; before the first key, earlier channel authority or staged placement remains in charge.
     */
    clips: IAutoMovieClip[];
    /**
     * New array of accepted launches' interaction events with original actionIndex. Events remain in launch-job order here; performShot sorts the assembled shot's event list later.
     */
    events: IAutoMovieInteractionEvent[];
  };
}
