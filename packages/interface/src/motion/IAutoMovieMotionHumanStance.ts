import type { IAutoMovieMotionHumanStand } from "./IAutoMovieMotionHumanStand";
import type { IAutoMovieMotionHumanCrouch } from "./IAutoMovieMotionHumanCrouch";
import type { IAutoMovieMotionHumanRest } from "./IAutoMovieMotionHumanRest";

/**
 * The standing postures: quiet standing, shifting weight, bending, crouching,
 * bracing, resting and curtsying.
 *
 * A planted posture computes no balance. A named rest or hold that fixes
 * parameter values is a preset, data spread into the law's parameters beside
 * the hold: `AutoMovieMotionHumanStance.ARMS_CROSSED`, `HANDS_ON_HIPS`,
 * `HANDS_IN_POCKETS`, `PARADE_REST`, `HANDS_CLASPED`, `HANDS_BEHIND_HEAD` and
 * `THINKING`, `REST_SIDE`, `CHIN_REST` and `ELBOW_SUPPORT` (`IRestPreset`),
 * `SQUAT_SIT` and `TAKE_COVER` (`ICrouchPreset`) and `MOUNTAIN_POSE`
 * (`IStandPreset`); a preset adds no method.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanStance` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */


/** The parameter types of the Stance methods. */
export namespace IAutoMovieMotionHumanStance {
  /**
   * The places of both hands that a named rest fixes: the `left` and `right` of
   * `rest`. Spread into `rest`'s parameters with the hold; the preset constants
   * of `AutoMovieMotionHumanStance` (`ARMS_CROSSED`, `HANDS_ON_HIPS`,
   * `HANDS_IN_POCKETS`, `PARADE_REST`, `HANDS_CLASPED`, `HANDS_BEHIND_HEAD` and
   * `THINKING`) are its data and the rows of the same names read them.
   */
  export type IRestPreset = Pick<
    IAutoMovieMotionHumanRest.IParams,
    "left" | "right"
  >;

  /**
   * The hold that a named stand fixes: the `hold` of `stand`, in seconds.
   * Spread into `stand`'s parameters;
   * `AutoMovieMotionHumanStance.MOUNTAIN_POSE` is its data and the
   * `mountainPose` row reads it.
   */
  export type IStandPreset = Pick<IAutoMovieMotionHumanStand.IParams, "hold">;

  /**
   * The depth, heel position and hold that a named crouch fixes: the `depth`,
   * `heels` and `hold` of `crouch`. Spread into `crouch`'s parameters;
   * `AutoMovieMotionHumanStance.SQUAT_SIT` and `TAKE_COVER` are its data and
   * the rows of the same names read them.
   */
  export type ICrouchPreset = Pick<
    IAutoMovieMotionHumanCrouch.IParams,
    "depth" | "heels" | "hold"
  >;
}
