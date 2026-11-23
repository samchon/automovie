import type { IAutoMovieChain } from "../../composition/IAutoMovieChain";
import type { IAutoMovieMotionHumanChainCore } from "../chain/IAutoMovieMotionHumanChainCore";
import type { IAutoMovieMotionHumanCrouch } from "../everyday/IAutoMovieMotionHumanCrouch";
import type { IAutoMovieMotionHumanLieDown } from "../floor/IAutoMovieMotionHumanLieDown";
import type { IAutoMovieMotionHumanClinch } from "../grappling/IAutoMovieMotionHumanClinch";
import type { IAutoMovieMotionHumanBladeExchange } from "../lexicon/IAutoMovieMotionHumanBladeExchange";
import type { IAutoMovieMotionHumanStageBladeFootwork } from "../lexicon/IAutoMovieMotionHumanStageBladeFootwork";
import type { IAutoMovieMotionHumanStageProp } from "../lexicon/IAutoMovieMotionHumanStageProp";
import type { IAutoMovieMotionHumanGive } from "../reaction/IAutoMovieMotionHumanGive";
import type { IAutoMovieMotionHumanStagger } from "../reaction/IAutoMovieMotionHumanStagger";
import type { IAutoMovieMotionHumanCloseStrike } from "../striking/IAutoMovieMotionHumanCloseStrike";
import type { IAutoMovieMotionHumanPunch } from "../striking/IAutoMovieMotionHumanPunch";
import type { IAutoMovieMotionHumanStep } from "../striking/IAutoMovieMotionHumanStep";
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
export interface IAutoMovieMotionHumanStageFight<Chain> {
  /**
   * Compose a blocked opening and an optional reply for a staged blade exchange
   * between two distinct performers; the opening performer opens and the
   * responding performer blocks.
   *
   * @param opening Entry chain of the opening performer.
   * @param responding Entry chain of the responding performer.
   * @param exchange Stable cue id, held-prop subjects, stage marks and block
   *   lead in film seconds.
   * @returns The composed performance chain.
   * @throws {Error} When the cast coincides, a cue or id is blank, or a time is
   *   invalid.
   */
  bladeExchange(
    opening: IAutoMovieMotionHumanChainCore,
    responding: IAutoMovieMotionHumanChainCore,
    exchange: IAutoMovieMotionHumanBladeExchange,
  ): IAutoMovieChain;

  /**
   * Append a visual prop beat and, when authored, a second performer's
   * response.
   *
   * @param performer The performer carrying the digital prop.
   * @param beat The visual pose and prop mark.
   * @param cue An anchor unique within the scene.
   * @param response The optional responding performer and reaction timing.
   * @returns The composed performance chain.
   * @throws {Error} When the cast coincides, a cue or id is blank, or a time is
   *   invalid.
   */
  stageProp(
    performer: IAutoMovieMotionHumanChainCore,
    beat: IAutoMovieMotionHumanStageProp,
    cue: string,
    response?: IAutoMovieMotionHumanStageFight.IResponse,
  ): IAutoMovieChain;

  /**
   * Controls for one grounded stage mark shift with a padded blade silhouette.
   *
   * Registered law: `registered("stageBladeFootwork", params)`; not a chain
   * method.
   *
   * @param params The `style`, `direction`, `lead`, `distance`, `duration` and
   *   `propCue` of `IAutoMovieMotionHumanStageBladeFootwork.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  stageBladeFootwork(
    params: IAutoMovieMotionHumanStageFight.IStageBladeFootwork,
    anchor?: string,
  ): Chain;
}

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
