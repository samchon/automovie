import type { IAutoMovieMotionHumanMartialArt } from "./IAutoMovieMotionHumanMartialArt";
import type { IAutoMovieMotionHumanCloseStrike } from "./IAutoMovieMotionHumanCloseStrike";
import type { IAutoMovieMotionHumanFootStrike } from "./IAutoMovieMotionHumanFootStrike";
import type { IAutoMovieMotionHumanKick } from "./IAutoMovieMotionHumanKick";
import type { IAutoMovieMotionHumanKnee } from "./IAutoMovieMotionHumanKnee";
import type { IAutoMovieMotionHumanPunch } from "./IAutoMovieMotionHumanPunch";
import type { IAutoMovieMotionHumanStep } from "./IAutoMovieMotionHumanStep";

/**
 * The strikes: punches, kicks, knees and the close and foot strikes, which
 * share one timing model, the striking reach solve and the performer's skill
 * (`StrikingSkill`). A rear straight takes 0.31 s from launch to contact at
 * elite skill and 0.33 s at novice, and a jab less; a kick takes 0.33 s at
 * elite and 0.39 s at novice. A punch's instants are `launch`, `impact` and
 * `recovered` (`shown` instead of `impact` when it feints), a kick's `launch`,
 * `chamber`, `impact` and `replant`; a strike has no `contact` event, so
 * `sync({ of })` without `event` takes its impact. A kick is cut only into
 * another kick, and only until its chamber, so a `stand` or `guard` synced onto
 * a running kick is refused with its legal windows.
 *
 * A named technique that fixes only some of a law's parameters is a preset,
 * data spread into that law's parameters beside the target:
 * `AutoMovieMotionHumanStrike.JAB`, `CROSS`, the hooks, uppercuts, elbows,
 * kicks and knees (`IPunchPreset`, `IFootStrikePreset`, `ICloseStrikePreset`,
 * `IKickPreset` and `IKneePreset`); a preset adds no method.
 *
 * A method here is a method of `AutoMovieMotionHumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanStrike` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanStrike<Chain> {
  /**
   * A punch: the fist's knuckles brought onto the target along a measured path
   * and returned to the guard, with the trunk turning and the feet stepping or
   * pivoting to carry the shoulder.
   *
   * @param params The `technique`, `hand`, `at`, `accuracy`, `feint` and
   *   `manner` of `IAutoMovieMotionHumanPunch.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  punch(params: IAutoMovieMotionHumanPunch.IParams, anchor?: string): Chain;

  /**
   * A kick: the round kick's lower shin or the push kick's ball of the foot
   * brought onto the target, through a chamber, and recoiled to the replant.
   *
   * @param params The `technique`, `leg`, `at`, `accuracy` and `feint` of
   *   `IAutoMovieMotionHumanKick.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  kick(params: IAutoMovieMotionHumanKick.IParams, anchor?: string): Chain;

  /**
   * A knee strike: the knee driven up and forward onto the target while the
   * hands hold the opponent's head or neck (the clinch) or stay at the guard.
   *
   * @param params The `at` and `leg` of `IAutoMovieMotionHumanKnee.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  knee(params: IAutoMovieMotionHumanKnee.IParams, anchor?: string): Chain;

  /**
   * A close strike: the point of the elbow, the back of a spinning fist or the
   * forehead brought onto a target inside the punch's range.
   *
   * @param params The `technique`, `at`, `arm` and `feint` of
   *   `IAutoMovieMotionHumanCloseStrike.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  closeStrike(
    params: IAutoMovieMotionHumanCloseStrike.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A foot strike beyond the round and push kicks: the heel, the sole or the
   * blade of the foot brought onto the target through a chamber and recoiled to
   * the stance.
   *
   * @param params The `technique`, `at`, `leg`, `spin` and `jump` of
   *   `IAutoMovieMotionHumanFootStrike.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  footStrike(
    params: IAutoMovieMotionHumanFootStrike.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Fighting-stance footwork: steps that keep the stance, the foot on the side
   * of travel moving first and the other following to restore it without
   * crossing (IBA coaching manual).
   *
   * @param params The `direction`, `steps`, `length`, `turn`, `lead` and
   *   `guard` of `IAutoMovieMotionHumanStep.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  step(params: IAutoMovieMotionHumanStep.IParams, anchor?: string): Chain;

  /**
   * Martial-art forms other than kickboxing: the karate horse stance
   * (kiba-dachi), alternating straight punches from it (choku-zuki) and the tai
   * chi push in a bow stance.
   *
   * @param params The `kind`, `count`, `hold`, `lead` and `manner` of
   *   `IAutoMovieMotionHumanMartialArt.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  martialArt(
    params: IAutoMovieMotionHumanMartialArt.IParams,
    anchor?: string,
  ): Chain;
}

/** The parameter types of the Strike methods. */
export namespace IAutoMovieMotionHumanStrike {
  /**
   * A punch preset: the technique and the hand a named punch fixes, such as the
   * jab (a straight with the lead hand). Spread into `punch`'s parameters with
   * the target; each value means what the punch's member of the same name
   * does.
   */
  export interface IPunchPreset {
    /** The punch's technique, as `IAutoMovieMotionHumanPunch.IParams.technique`. */
    technique: IAutoMovieMotionHumanPunch.Technique;

    /** The punching hand, as `IAutoMovieMotionHumanPunch.IParams.hand`. */
    hand: IAutoMovieMotionHumanPunch.Hand;
  }

  /**
   * A foot-strike preset: the technique and the leg a named foot strike fixes,
   * and the whole turn or the jump where the strike has one. Spread into
   * `footStrike`'s parameters with the target; each value means what the foot
   * strike's member of the same name does.
   */
  export interface IFootStrikePreset {
    /**
     * The foot strike's technique, as
     * `IAutoMovieMotionHumanFootStrike.IParams.technique`.
     */
    technique: IAutoMovieMotionHumanFootStrike.Technique;

    /** The striking leg, as `IAutoMovieMotionHumanFootStrike.IParams.leg`. */
    leg: IAutoMovieMotionHumanFootStrike.Leg;

    /**
     * A whole turn on the support ball before the strike, as
     * `IAutoMovieMotionHumanFootStrike.IParams.spin`; not fixed when absent.
     */
    spin?: boolean;

    /**
     * Off the floor at the contact, as
     * `IAutoMovieMotionHumanFootStrike.IParams.jump`; not fixed when absent.
     */
    jump?: boolean;
  }

  /**
   * A close-strike preset: the technique a named elbow or headbutt fixes and,
   * for an elbow, the arm. Spread into `closeStrike`'s parameters with the
   * target; each value means what the close strike's member of the same name
   * does.
   */
  export interface ICloseStrikePreset {
    /**
     * The close strike's technique, as
     * `IAutoMovieMotionHumanCloseStrike.IParams.technique`.
     */
    technique: IAutoMovieMotionHumanCloseStrike.Technique;

    /**
     * The striking arm, as `IAutoMovieMotionHumanCloseStrike.IParams.arm`; not
     * fixed when absent.
     */
    arm?: IAutoMovieMotionHumanCloseStrike.Arm;
  }

  /**
   * A kick preset: the technique and the leg a named kick fixes, such as the
   * teep (a push kick with the rear leg). Spread into `kick`'s parameters with
   * the target; each value means what the kick's member of the same name does.
   */
  export interface IKickPreset {
    /** The kick's technique, as `IAutoMovieMotionHumanKick.IParams.technique`. */
    technique: IAutoMovieMotionHumanKick.Technique;

    /** The kicking leg, as `IAutoMovieMotionHumanKick.IParams.leg`. */
    leg: IAutoMovieMotionHumanKick.Leg;
  }

  /**
   * A knee preset: the leg a named knee strike fixes, the lead knee or the rear
   * knee. Spread into `knee`'s parameters with the target.
   */
  export interface IKneePreset {
    /** The kneeing leg, as `IAutoMovieMotionHumanKnee.IParams.leg`. */
    leg: IAutoMovieMotionHumanKnee.Leg;
  }

  /**
   * The parameters a punch row leaves to the composition: the punch's
   * parameters without the technique and the hand its preset fixes.
   */
  export type IPunchRow = Omit<
    IAutoMovieMotionHumanPunch.IParams,
    keyof IPunchPreset
  >;

  /**
   * The parameters a foot-strike row leaves to the composition: the foot
   * strike's parameters without the technique, the leg, the turn and the jump
   * its preset fixes.
   */
  export type IFootStrikeRow = Omit<
    IAutoMovieMotionHumanFootStrike.IParams,
    keyof IFootStrikePreset
  >;

  /**
   * The parameters a close-strike row leaves to the composition: the close
   * strike's parameters without the technique and the arm its preset fixes.
   */
  export type ICloseStrikeRow = Omit<
    IAutoMovieMotionHumanCloseStrike.IParams,
    keyof ICloseStrikePreset
  >;

  /**
   * The parameters a kick row leaves to the composition: the kick's parameters
   * without the technique and the leg its preset fixes.
   */
  export type IKickRow = Omit<
    IAutoMovieMotionHumanKick.IParams,
    keyof IKickPreset
  >;

  /**
   * The parameters a knee row leaves to the composition: the knee's parameters
   * without the leg its preset fixes.
   */
  export type IKneeRow = Omit<
    IAutoMovieMotionHumanKnee.IParams,
    keyof IKneePreset
  >;
}
