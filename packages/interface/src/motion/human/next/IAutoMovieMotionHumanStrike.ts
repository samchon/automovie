import type { IAutoMovieMotionHumanMartialArt } from "../sport/IAutoMovieMotionHumanMartialArt";
import type { IAutoMovieMotionHumanCloseStrike } from "../striking/IAutoMovieMotionHumanCloseStrike";
import type { IAutoMovieMotionHumanFootStrike } from "../striking/IAutoMovieMotionHumanFootStrike";
import type { IAutoMovieMotionHumanKick } from "../striking/IAutoMovieMotionHumanKick";
import type { IAutoMovieMotionHumanKnee } from "../striking/IAutoMovieMotionHumanKnee";
import type { IAutoMovieMotionHumanPunch } from "../striking/IAutoMovieMotionHumanPunch";
import type { IAutoMovieMotionHumanStep } from "../striking/IAutoMovieMotionHumanStep";

/**
 * The strikes: punches, kicks, knees and the close and foot strikes, which share one timing model, the striking reach solve and the performer's skill (`StrikingSkill`). A lone punch takes 0.405 s from launch to contact at elite skill and 0.43 s at novice; a kick takes 0.33 s at elite and 0.39 s at novice.
 *
 * A named technique that fixes only some of a law's parameters is a preset, data spread into that law's parameters beside the target: `AutoMovieMotionHumanStrike.JAB`, `CROSS`, the hooks, uppercuts, elbows, kicks and knees (`IPunchPreset`, `IFootStrikePreset`, `ICloseStrikePreset`, `IKickPreset` and `IKneePreset`); a preset adds no method.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Strike family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Strike laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanStrike<Chain> {
  /**
   * A punch: the fist's knuckles brought onto the target along a measured path and returned to the guard, with the trunk turning and the feet stepping or pivoting to carry the shoulder.
   *
   * @param params The `technique`, `hand`, `at`, `accuracy`, `feint` and `manner` of `IAutoMovieMotionHumanPunch.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  punch(params: IAutoMovieMotionHumanPunch.IParams, anchor?: string): Chain;

  /**
   * A kick: the round kick's lower shin or the push kick's ball of the foot brought onto the target, through a chamber, and recoiled to the replant.
   *
   * @param params The `technique`, `leg`, `at`, `accuracy` and `feint` of `IAutoMovieMotionHumanKick.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  kick(params: IAutoMovieMotionHumanKick.IParams, anchor?: string): Chain;

  /**
   * A knee strike: the knee driven up and forward onto the target while the hands hold the opponent's head or neck (the clinch) or stay at the guard.
   *
   * @param params The `at` and `leg` of `IAutoMovieMotionHumanKnee.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  knee(params: IAutoMovieMotionHumanKnee.IParams, anchor?: string): Chain;

  /**
   * A close strike: the point of the elbow, the back of a spinning fist or the forehead brought onto a target inside the punch's range.
   *
   * @param params The `technique`, `at`, `arm` and `feint` of `IAutoMovieMotionHumanCloseStrike.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  closeStrike(
    params: IAutoMovieMotionHumanCloseStrike.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A foot strike beyond the round and push kicks: the heel, the sole or the blade of the foot brought onto the target through a chamber and recoiled to the stance.
   *
   * @param params The `technique`, `at`, `leg`, `spin` and `jump` of `IAutoMovieMotionHumanFootStrike.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  footStrike(
    params: IAutoMovieMotionHumanFootStrike.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Fighting-stance footwork: steps that keep the stance, the foot on the side of travel moving first and the other following to restore it without crossing (IBA coaching manual).
   *
   * @param params The `direction`, `steps`, `length`, `turn`, `lead` and `guard` of `IAutoMovieMotionHumanStep.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  step(params: IAutoMovieMotionHumanStep.IParams, anchor?: string): Chain;

  /**
   * Martial-art forms other than kickboxing (#3252): the karate horse stance (kiba-dachi), alternating straight punches from it (choku-zuki) and the tai chi push in a bow stance.
   *
   * @param params The `kind`, `count`, `seconds`, `lead` and `manner` of `IAutoMovieMotionHumanMartialArt.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  martialArt(
    params: IAutoMovieMotionHumanMartialArt.IParams,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Strike methods.
 */
export namespace IAutoMovieMotionHumanStrike {
  /**
   * A punch preset: the technique and the hand a named punch fixes, such as the jab (a straight with the lead hand). Spread into `punch`'s parameters with the target; each value means what the punch's member of the same name does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and where its members' meanings are.
   * @evidence contracts/development/design.md#principled-representation Two required members typed by the punch law's own named unions, so a preset always fixes exactly the technique and the hand and the punch keeps every other default.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; `AutoMovieMotionHumanStrike.JAB`, `CROSS`, `LEAD_HOOK`, `REAR_HOOK`, `LEAD_UPPERCUT`, `REAR_UPPERCUT`, `CHAIN_PUNCH`, `REAR_CHAIN_PUNCH`, `BACKFIST`, `HAMMERFIST` and `PALM_HEEL` are its data and the lexicon rows of the same names read them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the members are named once here instead of an inline pick of the punch's parameters.
   */
  export interface IPunchPreset {
    /** The punch's technique, as `IAutoMovieMotionHumanPunch.IParams.technique`. */
    technique: IAutoMovieMotionHumanPunch.Technique;

    /** The punching hand, as `IAutoMovieMotionHumanPunch.IParams.hand`. */
    hand: IAutoMovieMotionHumanPunch.Hand;
  }

  /**
   * A foot-strike preset: the technique and the leg a named foot strike fixes, and the whole turn or the jump where the strike has one. Spread into `footStrike`'s parameters with the target; each value means what the foot strike's member of the same name does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and where its members' meanings are.
   * @evidence contracts/development/design.md#principled-representation The technique and the leg are required and typed by the foot strike's own named unions; `spin` and `jump` are fixed only by the strikes that turn or leave the floor, so the foot strike keeps its defaults otherwise.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; `AutoMovieMotionHumanStrike.MEIA_LUA_DE_FRENTE`, `ARMADA`, `SIDE_KICK`, `BACK_KICK`, `HOOK_KICK`, `CRESCENT_KICK`, `AXE_KICK`, `STOMP`, `LEG_SWEEP`, `SPINNING_HOOK_KICK` and `JUMPING_SIDE_KICK` are its data and the lexicon rows of the same names read them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the members are named once here instead of an inline pick of the foot strike's parameters.
   */
  export interface IFootStrikePreset {
    /** The foot strike's technique, as `IAutoMovieMotionHumanFootStrike.IParams.technique`. */
    technique: IAutoMovieMotionHumanFootStrike.Technique;

    /** The striking leg, as `IAutoMovieMotionHumanFootStrike.IParams.leg`. */
    leg: IAutoMovieMotionHumanFootStrike.Leg;

    /** A whole turn on the support ball before the strike, as `IAutoMovieMotionHumanFootStrike.IParams.spin`; not fixed when absent. */
    spin?: boolean;

    /** Off the floor at the contact, as `IAutoMovieMotionHumanFootStrike.IParams.jump`; not fixed when absent. */
    jump?: boolean;
  }

  /**
   * A close-strike preset: the technique a named elbow or headbutt fixes and, for an elbow, the arm. Spread into `closeStrike`'s parameters with the target; each value means what the close strike's member of the same name does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and where its members' meanings are.
   * @evidence contracts/development/design.md#principled-representation The technique is required and typed by the close strike's own named union; `arm` is fixed by the elbows and left to the close strike's default by the headbutt, which has no arm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; `AutoMovieMotionHumanStrike.HORIZONTAL_ELBOW`, `RISING_ELBOW`, `DESCENDING_ELBOW`, `SPINNING_ELBOW`, `SPINNING_BACKFIST` and `HEADBUTT` are its data and the lexicon rows of the same names read them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the members are named once here instead of an inline pick of the close strike's parameters.
   */
  export interface ICloseStrikePreset {
    /** The close strike's technique, as `IAutoMovieMotionHumanCloseStrike.IParams.technique`. */
    technique: IAutoMovieMotionHumanCloseStrike.Technique;

    /** The striking arm, as `IAutoMovieMotionHumanCloseStrike.IParams.arm`; not fixed when absent. */
    arm?: IAutoMovieMotionHumanCloseStrike.Arm;
  }

  /**
   * A kick preset: the technique and the leg a named kick fixes, such as the teep (a push kick with the rear leg). Spread into `kick`'s parameters with the target; each value means what the kick's member of the same name does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and where its members' meanings are.
   * @evidence contracts/development/design.md#principled-representation Two required members typed by the kick law's own named unions, so a preset always fixes exactly the technique and the leg.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; `AutoMovieMotionHumanStrike.ROUND_KICK`, `SWITCH_KICK`, `PUSH_KICK` and `TEEP` are its data and the lexicon rows of the same names read them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the members are named once here instead of an inline pick of the kick's parameters.
   */
  export interface IKickPreset {
    /** The kick's technique, as `IAutoMovieMotionHumanKick.IParams.technique`. */
    technique: IAutoMovieMotionHumanKick.Technique;

    /** The kicking leg, as `IAutoMovieMotionHumanKick.IParams.leg`. */
    leg: IAutoMovieMotionHumanKick.Leg;
  }

  /**
   * A knee preset: the leg a named knee strike fixes, the lead knee or the rear knee. Spread into `knee`'s parameters with the target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and where its member's meaning is.
   * @evidence contracts/development/design.md#principled-representation One required member typed by the knee law's own named union, so a preset always fixes exactly the leg.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; `AutoMovieMotionHumanStrike.LEAD_KNEE` and `REAR_KNEE` are its data and the lexicon rows of the same names read them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the member is named once here instead of an inline pick of the knee's parameters.
   */
  export interface IKneePreset {
    /** The kneeing leg, as `IAutoMovieMotionHumanKnee.IParams.leg`. */
    leg: IAutoMovieMotionHumanKnee.Leg;
  }

  /**
   * The parameters a punch row leaves to the composition: the punch's parameters without the technique and the hand its preset fixes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameters a punch row takes and the two it fixes.
   * @evidence contracts/development/design.md#principled-representation The punch's own parameters less exactly the members of `IPunchPreset`, so a row cannot be given what its preset fixes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPunch.IParams` owns the shape; the lexicon's strike map names the rows' parameters by this alias.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: one named projection instead of an inline `Omit` in every row.
   */
  export type IPunchRow = Omit<
    IAutoMovieMotionHumanPunch.IParams,
    keyof IPunchPreset
  >;

  /**
   * The parameters a foot-strike row leaves to the composition: the foot strike's parameters without the technique, the leg, the turn and the jump its preset fixes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameters a foot-strike row takes and the four it fixes.
   * @evidence contracts/development/design.md#principled-representation The foot strike's own parameters less exactly the members of `IFootStrikePreset`, so a row cannot be given what its preset fixes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanFootStrike.IParams` owns the shape; the lexicon's strike map names the rows' parameters by this alias.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: one named projection instead of an inline `Omit` in every row.
   */
  export type IFootStrikeRow = Omit<
    IAutoMovieMotionHumanFootStrike.IParams,
    keyof IFootStrikePreset
  >;

  /**
   * The parameters a close-strike row leaves to the composition: the close strike's parameters without the technique and the arm its preset fixes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameters a close-strike row takes and the two it fixes.
   * @evidence contracts/development/design.md#principled-representation The close strike's own parameters less exactly the members of `ICloseStrikePreset`, so a row cannot be given what its preset fixes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCloseStrike.IParams` owns the shape; the lexicon's strike map names the rows' parameters by this alias.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: one named projection instead of an inline `Omit` in every row.
   */
  export type ICloseStrikeRow = Omit<
    IAutoMovieMotionHumanCloseStrike.IParams,
    keyof ICloseStrikePreset
  >;

  /**
   * The parameters a kick row leaves to the composition: the kick's parameters without the technique and the leg its preset fixes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameters a kick row takes and the two it fixes.
   * @evidence contracts/development/design.md#principled-representation The kick's own parameters less exactly the members of `IKickPreset`, so a row cannot be given what its preset fixes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanKick.IParams` owns the shape; the lexicon's strike map names the rows' parameters by this alias.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: one named projection instead of an inline `Omit` in every row.
   */
  export type IKickRow = Omit<
    IAutoMovieMotionHumanKick.IParams,
    keyof IKickPreset
  >;

  /**
   * The parameters a knee row leaves to the composition: the knee's parameters without the leg its preset fixes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameters a knee row takes and the one it fixes.
   * @evidence contracts/development/design.md#principled-representation The knee's own parameters less exactly the member of `IKneePreset`, so a row cannot be given what its preset fixes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanKnee.IParams` owns the shape; the lexicon's strike map names the rows' parameters by this alias.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: one named projection instead of an inline `Omit` in every row.
   */
  export type IKneeRow = Omit<
    IAutoMovieMotionHumanKnee.IParams,
    keyof IKneePreset
  >;
}
