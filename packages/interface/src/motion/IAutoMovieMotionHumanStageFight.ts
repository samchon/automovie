
import type { IAutoMovieMotionHumanChainCore } from "./IAutoMovieMotionHumanChainCore";
import type { IAutoMovieMotionHumanCrouch } from "./IAutoMovieMotionHumanCrouch";
import type { IAutoMovieMotionHumanLieDown } from "./IAutoMovieMotionHumanLieDown";
import type { IAutoMovieMotionHumanClinch } from "./IAutoMovieMotionHumanClinch";
import type { IAutoMovieMotionHumanStageBladeFootwork } from "./IAutoMovieMotionHumanStageBladeFootwork";
import type { IAutoMovieMotionHumanGive } from "./IAutoMovieMotionHumanGive";
import type { IAutoMovieMotionHumanStagger } from "./IAutoMovieMotionHumanStagger";
import type { IAutoMovieMotionHumanCloseStrike } from "./IAutoMovieMotionHumanCloseStrike";
import type { IAutoMovieMotionHumanPunch } from "./IAutoMovieMotionHumanPunch";
import type { IAutoMovieMotionHumanStep } from "./IAutoMovieMotionHumanStep";
import type { IAutoMovieMotionHumanTouch } from "./IAutoMovieMotionHumanTouch";

/**
 * Stage fighting: a staged blade exchange between two performers, a visual prop
 * beat with an optional partner response, the padded blade footwork, and the
 * non-contact slaps, grabs, holds and the receiver's responses short of a
 * strike.
 *
 * Each blow is a row of a shipped action on a partner the composition names;
 * the row leaves the target or the partner open. The receiver's response is its
 * own row (`slapped`, `shoved`, `grabbed`, `pushed`), whose start the
 * composition syncs to the attacker's contact. A stage palm strike and a stage
 * headbutt are driven at the target and stopped short at 0.85 of their delivery
 * (provisional) with no contact declared, and a stage slap passes half a hand's
 * length clear of the cheek (provisional). The partner's flinch in `stageProp`
 * starts at the prop beat's named `stroke` event plus any authored delay, and
 * the timing adds no contact between performers.
 *
 * The presets are the constants of `AutoMovieMotionHumanStageFight` that the
 * rows of `HumanStageFight` read; each names the members of its law that the
 * row fixes.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanStageFight` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */


/** The parameter and preset types of the family's methods. */
export namespace IAutoMovieMotionHumanStageFight {
  /** The optional authored partner response of a prop beat. */
  export interface IResponse {
    /** The other performer's chain. */
    performer: IAutoMovieMotionHumanChainCore;

    /** Seconds after the visual cue. Defaults to zero. */
    delay?: number;
  }

  /**
   * The parameters of `stageBladeFootwork`: the law's own
   * `IAutoMovieMotionHumanStageBladeFootwork.IParams`, unchanged.
   */
  export type IStageBladeFootwork =
    IAutoMovieMotionHumanStageBladeFootwork.IParams;

  /**
   * The punch the `STAGE_PALM_STRIKE` preset fixes: the rear palm heel stopped
   * short at 0.85 of its delivery.
   */
  export type IStagePunchPreset = Pick<
    IAutoMovieMotionHumanPunch.IParams,
    "technique" | "hand" | "feint"
  >;

  /**
   * The close strike the `STAGE_HEADBUTT` preset fixes: the forehead stopped
   * short at 0.85 of its delivery.
   */
  export type IStageHeadbuttPreset = Pick<
    IAutoMovieMotionHumanCloseStrike.IParams,
    "technique" | "feint"
  >;

  /**
   * The touch the `SLAP` and `BACKHAND` presets fix: one tap swept across the
   * target.
   */
  export type ITapPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count" | "tangent"
  >;

  /**
   * The touch the `STAGE_SLAP` preset fixes: one tap across the cheek, half a
   * hand's length clear of it.
   */
  export type IStageSlapPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count" | "tangent" | "clear"
  >;

  /**
   * The touch the `SHOVE` and `GRAB` presets fix: one press or squeeze of the
   * palm.
   */
  export type IPressPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count"
  >;

  /** The touch the `POKE` preset fixes: a tap of the fingertips. */
  export type IPokePreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind"
  >;

  /**
   * The touch the `CHOKE`, `HAIR_PULL` and `STRUGGLE` presets fix: one squeeze
   * of the palm held for a time.
   */
  export type IHoldPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count" | "hold"
  >;

  /** The hold, in seconds, the `RESTRAIN` and `HEADLOCK` presets fix. */
  export type IClinchPreset = Pick<IAutoMovieMotionHumanClinch.IParams, "hold">;

  /**
   * The body part and direction the `SLAPPED`, `GRABBED` and `LEAN_BACK`
   * presets fix.
   */
  export type IGivePreset = Pick<
    IAutoMovieMotionHumanGive.IParams,
    "part" | "way"
  >;

  /** The body part, direction and intensity the `PUSHED` preset fixes. */
  export type IPushedPreset = Pick<
    IAutoMovieMotionHumanGive.IParams,
    "part" | "way" | "intensity"
  >;

  /** The speed the `SHOVED` preset fixes for the receiver's stagger. */
  export type IShovedPreset = Pick<
    IAutoMovieMotionHumanStagger.IParams,
    "speed"
  >;

  /** The lie down the `DIVE_FOR_COVER` preset fixes: prone, held for a time. */
  export type IDivePreset = Pick<
    IAutoMovieMotionHumanLieDown.IParams,
    "kind" | "hold"
  >;

  /** The crouch the `DUCK` and `ESQUIVA` presets fix: a depth held for a time. */
  export type ICrouchPreset = Pick<
    IAutoMovieMotionHumanCrouch.IParams,
    "depth" | "hold"
  >;

  /** The direction and step count the `DODGE` preset fixes. */
  export type IFootworkPreset = Pick<
    IAutoMovieMotionHumanStep.IParams,
    "direction" | "steps"
  >;
}
