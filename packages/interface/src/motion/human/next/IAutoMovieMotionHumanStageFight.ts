import type { IAutoMovieMotionHumanChainCore } from "../chain/IAutoMovieMotionHumanChainCore";
import type { IAutoMovieChain } from "../../composition/IAutoMovieChain";
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
 * Stage fighting: a staged blade exchange between two performers, a visual prop beat with an optional partner response, the padded blade footwork, and the non-contact slaps, grabs, holds and the receiver's responses short of a strike.
 *
 * Each blow is a row of a shipped action on a partner the composition names; the row leaves the target or the partner open. The receiver's response is its own row (`slapped`, `shoved`, `grabbed`, `pushed`), whose start the composition syncs to the attacker's contact. A stage palm strike and a stage headbutt are driven at the target and stopped short at 0.85 of their delivery (provisional) with no contact declared, and a stage slap passes half a hand's length clear of the cheek (provisional). The partner's flinch in `stageProp` starts at the prop beat's named `stroke` event plus any authored delay, and the timing adds no contact between performers.
 *
 * The presets are the constants of `AutoMovieMotionHumanStageFight` that the rows of `HumanStageFight` read; each names the members of its law that the row fixes.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the stage-fight model: the non-contact blows, the receiver's responses, the exchange and prop-beat compositions and the preset constants.
 * @evidence contracts/development/design.md#principled-representation One method per law of the family, each taking the law's own parameter type, and one named type per narrowing or preset.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's laws and presets and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law or a named narrowing of it; nothing is redefined.
 */
export interface IAutoMovieMotionHumanStageFight<Chain> {
  /**
   * Compose a blocked opening and an optional reply for a staged blade exchange between two distinct performers; the opening performer opens and the responding performer blocks.
   *
   * @param opening Entry chain of the opening performer.
   * @param responding Entry chain of the responding performer.
   * @param exchange Stable cue id, held-prop subjects, stage marks and block lead in film seconds.
   * @returns The composed performance chain.
   * @throws {Error} When the cast coincides, a cue or id is blank, or a time is invalid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the composition does, its parameters, its return and its refusals.
   */
  bladeExchange(
    opening: IAutoMovieMotionHumanChainCore,
    responding: IAutoMovieMotionHumanChainCore,
    exchange: IAutoMovieMotionHumanBladeExchange,
  ): IAutoMovieChain;

  /**
   * Append a visual prop beat and, when authored, a second performer's response.
   *
   * @param performer The performer carrying the digital prop.
   * @param beat The visual pose and prop mark.
   * @param cue An anchor unique within the scene.
   * @param response The optional responding performer and reaction timing.
   * @returns The composed performance chain.
   * @throws {Error} When the cast coincides, a cue or id is blank, or a time is invalid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the composition does, its parameters, its return and its refusals.
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
   * @param params The `style`, `direction`, `lead`, `distance`, `duration` and `propCue` of `IAutoMovieMotionHumanStageBladeFootwork.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  stageBladeFootwork(
    params: IAutoMovieMotionHumanStageFight.IStageBladeFootwork,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter and preset types of the family's methods.
 */
export namespace IAutoMovieMotionHumanStageFight {
  /**
   * The optional authored partner response of a prop beat.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the other performer and the delay with its unit and default.
   * @evidence contracts/development/design.md#principled-representation The delay is seconds after the visual cue, so the partner's flinch is placed against the beat's own event.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The record of one response and nothing else.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the response adds no contact between performers.
   */
  export interface IResponse {
    /** The other performer's chain. */
    performer: IAutoMovieMotionHumanChainCore;

    /** Seconds after the visual cue. Defaults to zero. */
    delay?: number;
  }

  /**
   * The parameters of `stageBladeFootwork`: the law's own `IAutoMovieMotionHumanStageBladeFootwork.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanStageBladeFootwork` owns the type; the alias serves this family's `stageBladeFootwork` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `stageBladeFootwork` takes the type its law reads.
   */
  export type IStageBladeFootwork =
    IAutoMovieMotionHumanStageBladeFootwork.IParams;

  /**
   * The punch the `STAGE_PALM_STRIKE` preset fixes: the rear palm heel stopped short at 0.85 of its delivery.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanPunch.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanPunch.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPunch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IStagePunchPreset = Pick<
    IAutoMovieMotionHumanPunch.IParams,
    "technique" | "hand" | "feint"
  >;

  /**
   * The close strike the `STAGE_HEADBUTT` preset fixes: the forehead stopped short at 0.85 of its delivery.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanCloseStrike.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanCloseStrike.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCloseStrike.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IStageHeadbuttPreset = Pick<
    IAutoMovieMotionHumanCloseStrike.IParams,
    "technique" | "feint"
  >;

  /**
   * The touch the `SLAP` and `BACKHAND` presets fix: one tap swept across the target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanTouch.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanTouch.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTouch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type ITapPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count" | "tangent"
  >;

  /**
   * The touch the `STAGE_SLAP` preset fixes: one tap across the cheek, half a hand's length clear of it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanTouch.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanTouch.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTouch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IStageSlapPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count" | "tangent" | "clear"
  >;

  /**
   * The touch the `SHOVE` and `GRAB` presets fix: one press or squeeze of the palm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanTouch.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanTouch.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTouch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IPressPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count"
  >;

  /**
   * The touch the `POKE` preset fixes: a tap of the fingertips.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanTouch.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanTouch.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTouch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IPokePreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind"
  >;

  /**
   * The touch the `CHOKE`, `HAIR_PULL` and `STRUGGLE` presets fix: one squeeze of the palm held for a time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanTouch.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanTouch.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTouch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IHoldPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count" | "hold"
  >;

  /**
   * The hold, in seconds, the `RESTRAIN` and `HEADLOCK` presets fix.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanClinch.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanClinch.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanClinch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IClinchPreset = Pick<IAutoMovieMotionHumanClinch.IParams, "hold">;

  /**
   * The body part and direction the `SLAPPED`, `GRABBED` and `LEAN_BACK` presets fix.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanGive.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanGive.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanGive.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IGivePreset = Pick<
    IAutoMovieMotionHumanGive.IParams,
    "part" | "way"
  >;

  /**
   * The body part, direction and intensity the `PUSHED` preset fixes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanGive.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanGive.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanGive.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IPushedPreset = Pick<
    IAutoMovieMotionHumanGive.IParams,
    "part" | "way" | "intensity"
  >;

  /**
   * The speed the `SHOVED` preset fixes for the receiver's stagger.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanStagger.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanStagger.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanStagger.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IShovedPreset = Pick<
    IAutoMovieMotionHumanStagger.IParams,
    "speed"
  >;

  /**
   * The lie down the `DIVE_FOR_COVER` preset fixes: prone, held for a time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanLieDown.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanLieDown.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanLieDown.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IDivePreset = Pick<
    IAutoMovieMotionHumanLieDown.IParams,
    "kind" | "hold"
  >;

  /**
   * The crouch the `DUCK` and `ESQUIVA` presets fix: a depth held for a time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanCrouch.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanCrouch.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCrouch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type ICrouchPreset = Pick<
    IAutoMovieMotionHumanCrouch.IParams,
    "depth" | "hold"
  >;

  /**
   * The direction and step count the `DODGE` preset fixes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanStep.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanStep.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanStep.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IFootworkPreset = Pick<
    IAutoMovieMotionHumanStep.IParams,
    "direction" | "steps"
  >;
}
