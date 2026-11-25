import type { IAutoMovieMotionHumanStand } from "../actions/IAutoMovieMotionHumanStand";
import type { IAutoMovieMotionHumanBend } from "../everyday/IAutoMovieMotionHumanBend";
import type { IAutoMovieMotionHumanBrace } from "../everyday/IAutoMovieMotionHumanBrace";
import type { IAutoMovieMotionHumanCrouch } from "../everyday/IAutoMovieMotionHumanCrouch";
import type { IAutoMovieMotionHumanCurtsy } from "../everyday/IAutoMovieMotionHumanCurtsy";
import type { IAutoMovieMotionHumanRest } from "../everyday/IAutoMovieMotionHumanRest";
import type { IAutoMovieMotionHumanShift } from "../everyday/IAutoMovieMotionHumanShift";

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
export interface IAutoMovieMotionHumanStance<Chain> {
  /**
   * Quiet standing: both feet planted where they are (or under the hips when
   * entered from the air), the pelvis settling over them, the column upright on
   * the plumb line and inclined slightly forward at the ankles
   * (`standUpright`), arms hanging relaxed, and the body swaying slightly.
   *
   * @param params The `hold`, `sway` and `on` of
   *   `IAutoMovieMotionHumanStand.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  stand(params: IAutoMovieMotionHumanStand.IParams, anchor?: string): Chain;

  /**
   * Shifting along a bench while seated: the seat socket slides sideways along
   * the seat by the requested distance, while the feet stay planted and the
   * hands stay on the thighs.
   *
   * @param params The `by` and `hold` of `IAutoMovieMotionHumanShift.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  shift(params: IAutoMovieMotionHumanShift.IParams, anchor?: string): Chain;

  /**
   * Bending down to bring a hand to a low point (the floor, a low shelf, a note
   * on the ground) with the feet planted, by a stoop, a squat or a semi-squat,
   * then straightening up.
   *
   * @param params The `balance`, `target`, `side`, `strategy` and `hold` of
   *   `IAutoMovieMotionHumanBend.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  bend(params: IAutoMovieMotionHumanBend.IParams, anchor?: string): Chain;

  /**
   * A crouch or a squat held in place: the hips sink over the planted feet to a
   * knee flexion the depth names, the trunk inclines until the centre of mass
   * is back over the feet, the hands come to rest on the thighs above the
   * knees, the body holds, then stands again.
   *
   * @param params The `balance`, `depth`, `heels`, `hold` and `manner` of
   *   `IAutoMovieMotionHumanCrouch.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  crouch(params: IAutoMovieMotionHumanCrouch.IParams, anchor?: string): Chain;

  /**
   * Bracing for an expected impact, push or a falling body: the stance widens
   * and staggers along the line of the coming force, the body lowers and leans
   * into it, and the hands come up in front, all set before the force arrives.
   *
   * @param params The `balance`, `target`, `kind` and `hold` of
   *   `IAutoMovieMotionHumanBrace.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  brace(params: IAutoMovieMotionHumanBrace.IParams, anchor?: string): Chain;

  /**
   * Standing with the hands at rest places: in the front pockets, on the hips,
   * arms crossed, clasped in front or behind, behind the head, or the chin on a
   * fist, each hand moved there and held.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims the arms it places, with their hands; it can be cut into `stand`,
   * `walk`, `look`, `gesture` and `rest` at any share.
   *
   * @param params The `left`, `right` and `hold` of
   *   `IAutoMovieMotionHumanRest.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  rest(params: IAutoMovieMotionHumanRest.IParams, anchor?: string): Chain;

  /**
   * One standing curtsy: a cross behind the supporting leg, a dip, and a return
   * to the original stance, admitted against the performer's available planted
   * reach.
   *
   * Registered law: `registered("curtsy", params)`; not a chain method.
   *
   * @param params The `side`, `depth` and `duration` of
   *   `IAutoMovieMotionHumanCurtsy`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  curtsy(params: IAutoMovieMotionHumanCurtsy, anchor?: string): Chain;
}

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
