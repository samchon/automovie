import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanClinch } from "../grappling/IAutoMovieMotionHumanClinch";
import type { IAutoMovieMotionHumanForceResponse } from "../grappling/IAutoMovieMotionHumanForceResponse";
import type { IAutoMovieMotionHumanKuzushi } from "../grappling/IAutoMovieMotionHumanKuzushi";
import type { IAutoMovieMotionHumanLungeGrab } from "../grappling/IAutoMovieMotionHumanLungeGrab";
import type { IAutoMovieMotionHumanArmWrestle } from "../touch/IAutoMovieMotionHumanArmWrestle";

/**
 * Holds, throws, clinches and arm wrestling between two bodies. The grappling
 * law reads no skill: its scene lengths are authored.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanGrapple` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanGrapple<Chain> {
  /**
   * Arm wrestle one role of a bout: the elbow planted on the table's top, the
   * hand clasped with the partner's above it, the struggle, and the pin onto
   * the winner's side. Both roles read one scene, so they agree without a
   * shared draw.
   *
   * Registered law: `registered("armWrestle", params)`; not a chain method.
   *
   * @param params The partner, the table, who wins, the bout's seconds and the
   *   pin.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the arm wrestle appended.
   */
  armWrestle(
    params: IAutoMovieMotionHumanArmWrestle.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Taking a clinch grip on a partner standing within reach and holding it: the
   * two-handed neck tie of Muay Thai (`plum`), or judo's collar and sleeve grip
   * (`collarSleeve`, kumikata).
   *
   * @param params The `balance`, `partner`, `grip`, `hand`, `hold`, `under` and
   *   `manner` of `IAutoMovieMotionHumanClinch.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  clinch(params: IAutoMovieMotionHumanClinch.IParams, anchor?: string): Chain;

  /**
   * Inputs shared by two actors in a preplanned sport grappling scene.
   *
   * Registered law: `registered("grapple", params)`; not a chain method.
   *
   * @param params The `role` and `partner` of
   *   `IAutoMovieMotionHumanGrapple.IParams`, with those of `IScene`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  grapple(params: IAutoMovieMotionHumanGrapple.IParams, anchor?: string): Chain;

  /**
   * A broken base (kuzushi): the receiver of a judo throw drawn off balance
   * forward, the whole body tipped about the ankles over the toes while the
   * feet stay on the floor, the stage before a throw carries the body over.
   *
   * Registered law: `registered("kuzushi", params)`; not a chain method.
   *
   * @param params The `partner`, `depth` and `hold` of
   *   `IAutoMovieMotionHumanKuzushi.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  kuzushi(params: IAutoMovieMotionHumanKuzushi.IParams, anchor?: string): Chain;

  /**
   * A sudden lunge that closes both hands on a victim's region, as a shambler
   * breaks from its walk: the front foot steps long, the trunk pitches forward
   * and the hands close on the region through the stage.
   *
   * Registered law: `registered("lungeGrab", params)`; not a chain method.
   *
   * @param params The `partner`, `region` and `side` of
   *   `IAutoMovieMotionHumanLungeGrab.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  lungeGrab(
    params: IAutoMovieMotionHumanLungeGrab.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A partner's response to a pull through grips, the outcomes of `perturb` a
   * sustained force decides: `resist`, `yield` and `thrown`.
   *
   * Registered law: `registered("forceResponse", params)`; not a chain method.
   *
   * @param params The `partner`, `fulcrum` and `on` of
   *   `IAutoMovieMotionHumanForceResponse.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  forceResponse(
    params: IAutoMovieMotionHumanForceResponse.IParams,
    anchor?: string,
  ): Chain;
}

/**
 * Inputs shared by two actors in a preplanned sport grappling scene. The scene
 * is one law and one parameter set for judo, wrestling, MMA mat work and sumo:
 * a paired clock of reach, take, release and rest beats whose length is
 * `seconds`, and an authored outcome. The scene takes 3 to 6 s at the lengths
 * on `Kind`; no skill or strength is read. A kind is a staging, not a rulebook:
 * the award is not inferred from the pose.
 */
export namespace IAutoMovieMotionHumanGrapple {
  /**
   * Staged entries and mat exchanges distinguished by their displayed movement.
   * The sumo bouts crouch at the shikiri lines, charge at the tachiai and end
   * with a push out of the ring (`oshiDashi`), a belt-grip force-out
   * (`yoriKiri`) or an overarm belt throw (`uwateNage`).
   */
  export type Kind =
    /** Judo shoulder throw, 3.5 s by default. */
    | "seoiNage"
    /** Judo hip throw, 3.8 s. */
    | "oGoshi"
    /** Judo major outer reap, 3.4 s. */
    | "oSotoGari"
    /** Judo forward foot sweep timed to the step, the quickest scene, 3 s. */
    | "deAshiHarai"
    /** Wrestling single-leg takedown, 3.8 s. */
    | "singleLeg"
    /** Wrestling double-leg takedown, 3.6 s. */
    | "doubleLeg"
    /** Greco-Roman upper-body throw, 3.8 s. */
    | "grecoRoman"
    /** Judo hold on the mat, 5 s. */
    | "judoHold"
    /** Wrestling fall to the back, 5 s. */
    | "wrestlingFall"
    /** Mat guard pass, the longest scene, 6 s. */
    | "guardPass"
    /** MMA reset after a mat exchange, 4.2 s. */
    | "mmaReset"
    /**
     * Sumo push out, 4.5 s: the crouch at the shikiri lines 0.7 m apart to 22 %
     * of the scene, the tachiai charge to 32 %, a drive of 2.1 m in 0.35 m
     * steps over the 4.55 m ring to 82 % (`grappleSumo.LINES`, `RING`, `DRIVE`,
     * `STEP`, `SHIKIRI`, `TACHIAI`, `FINISH`; the lengths are provisional). The
     * roots meet 0.3 stature apart, at arm's length.
     */
    | "oshiDashi"
    /**
     * Sumo belt-grip force-out, 5 s, timed and driven as `oshiDashi`; the roots
     * meet 0.22 stature apart, chest to chest.
     */
    | "yoriKiri"
    /**
     * Sumo overarm belt throw, 4 s, timed as `oshiDashi`; the roots meet 0.22
     * stature apart.
     */
    | "uwateNage";

  /** The two parts of a scene played on the same clock. */
  export type Role = "initiator" | "receiver";

  /** Whether the planned movement settles or is interrupted and released. */
  export type Outcome = "complete" | "denied";

  /** Settings common to both roles. */
  export interface IScene {
    /** Which authored scene to stage. */
    kind: Kind;

    /** Author's result, `complete` when absent. */
    outcome?: Outcome;

    /** Lead side of the staged scene, right when absent. */
    side?: AutoMovieHumanSide;

    /**
     * Total scene duration in seconds, positive and finite. Absent, each kind
     * takes its own length listed on `Kind` (`grappleStances.seconds`,
     * `grappleSumo.seconds`); every one is an authored staging length,
     * provisional: no study of a bout's phase times was read. The phases keep
     * their shares of it, so a longer scene is the same beats slower.
     */
    duration?: number;
  }

  /** One actor's action in a shared grappling scene. */
  export interface IParams extends IScene {
    /** The actor's part in the paired scene. */
    role: Role;

    /** The other actor's subject in the same performance. */
    partner: string;
  }

  /**
   * A clinch preset: the grip and the hold a named clinch fixes, such as judo's
   * grip (kumikata) for a throw. Spread into `clinch`'s parameters with the
   * partner; each value means what the clinch's member of the same name does.
   */
  export interface IClinchPreset {
    /** The grip, as `IAutoMovieMotionHumanClinch.IParams.grip`. */
    grip: IAutoMovieMotionHumanClinch.Grip;

    /** Seconds the grip is held, as `IAutoMovieMotionHumanClinch.IParams.hold`. */
    hold: number;
  }

  /**
   * The parameters a clinch row leaves to the composition: the clinch's
   * parameters without the grip and the hold its preset fixes.
   */
  export type IClinchRow = Omit<
    IAutoMovieMotionHumanClinch.IParams,
    keyof IClinchPreset
  >;
}
