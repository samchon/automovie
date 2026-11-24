import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { AutoMovieMotionHumanActionKey } from "../AutoMovieMotionHumanActionKey";
import type { AutoMovieMotionHumanChannelClaim } from "../compose/AutoMovieMotionHumanChannelClaim";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanStrikingHeld } from "../striking/IAutoMovieMotionHumanStrikingHeld";
import type { IAutoMovieMotionHumanActionContext } from "./IAutoMovieMotionHumanActionContext";
import type { IAutoMovieMotionHumanActionPlan } from "./IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanBalance } from "./IAutoMovieMotionHumanBalance";
import type { IAutoMovieMotionHumanInterruptRow } from "./IAutoMovieMotionHumanInterruptRow";

/**
 * One human action as a deterministic law: given its context (the body, the
 * parameters, the skill, the state it is entered from and its targets) it plans
 * its timing, events and contacts once, and its plan gives the posture at any
 * second as a pure function.
 *
 * `interrupts` is the action's closed cancel table, keyed by the action it may
 * cut into: only a cut that falls inside a listed window is legal, and an
 * undeclared cut is refused when the performance is built, with the legal
 * windows in the message, the way fighting-game cancel tables fire only
 * declared transitions.
 */
export interface IAutoMovieMotionHumanActionLaw<P = object> {
  /**
   * The action's name: a vocabulary name, or the name a production registers
   * the law under.
   */
  name: AutoMovieMotionHumanActionKey;

  /**
   * The action this one is a row of: the same law under another name with some
   * of its parameters fixed, as a salute is a touch. Wherever an action is told
   * apart by what it is (a cancel table's key, a follow-up that continues its
   * own kind, an answer to a kind of attack), a row counts as its family.
   * Absent for an action that is its own.
   */
  family?: AutoMovieMotionHumanActionKey;

  /**
   * The parameters the plan reads, from those the composition gave: a row adds
   * its fixed ones. The performance records and passes on the result, so
   * whatever reads a placed action's parameters reads the whole set.
   *
   * @param given The parameters the composition gave.
   * @returns The parameters planned from.
   */
  resolve?(given: object): object;

  /**
   * The cancel table: target action to the windows a cut may use. The key `any`
   * gives the windows a cut into every action may use, for an action a person
   * can leave for anything, as quiet standing is.
   */
  interrupts: Partial<
    Record<
      AutoMovieMotionHumanActionKey | "any",
      readonly IAutoMovieMotionHumanInterruptRow[]
    >
  >;

  /**
   * The table of what may be cut into this action, where the action itself
   * decides it: source action to the windows of that source a cut may use,
   * `any` for every source. A reaction to a blow or a threat interrupts
   * whatever the body was doing, so it declares that here instead of every
   * other action listing it. A source's own row for this action comes first;
   * these rows are read when it has none.
   */
  accepts?: Partial<
    Record<
      AutoMovieMotionHumanActionKey | "any",
      readonly IAutoMovieMotionHumanInterruptRow[]
    >
  >;

  /**
   * The channels this action lets an overlay take while it carries the body: a
   * walk yields its arms, its hands and its head, so a wave or a phone can be
   * performed during it. A digit yields that digit alone, so an overlay may
   * take a thumb while the other four keep holding. None when absent.
   */
  yields?: readonly AutoMovieMotionHumanChannelClaim[];

  /**
   * Whether the action can be performed over a carrier (`HumanChain.over`): it
   * plans on the carrier's posture and claims only the channels its plan names.
   * An action that moves the whole body cannot.
   */
  overlay?: boolean;

  /**
   * Whether the action's content is a staged physical outcome (a stagger, a
   * fall, a shove's or a force's response, a throw and a release, a flight): it
   * computes its physics on its own interval and bodies whatever its params'
   * `balance` says (`IAutoMovieMotionHumanBalance`), and the audit judges its
   * balance. Absent, the action is kinematic unless its params turn the option
   * on.
   */
  physical?: boolean;

  /**
   * The law's recommended balancing shift (`IAutoMovieMotionHumanBalance`). An
   * explicit parameter takes precedence. The cited study identifies the
   * affected part and when it contributes. The recommendation applies only when
   * the caller requests balance, and the correction moves that part by the
   * minimum amount its support needs, scaled by the requested weight.
   */
  balance?: IAutoMovieMotionHumanBalance;

  /**
   * Plan one instance of the action.
   *
   * @param context Body, parameters, skill, entry state and targets.
   * @returns The plan, whose postures are pure functions of seconds.
   */
  plan(
    context: IAutoMovieMotionHumanActionContext<P>,
  ): IAutoMovieMotionHumanActionPlan;

  /**
   * The poses this action will hold a prop in, asked before it is planned of
   * the grips an earlier action is still choosing among (`pickUp`): the
   * action's goal postures, computed from its own parameters by the functions
   * its plan reads, so a grip the earlier action takes for them is one this
   * action holds (goal postures planned first, Rosenbaum, Meulenbroek, Vaughan
   * and Jansen 2001; a task's goal pose as a grasp's constraint). Nothing is
   * planned: the action reads only what is known before it is, with the grip
   * weighed (`IAutoMovieMotionHumanActionLaw.IAhead`). Empty when the action
   * asks nothing of the grip, or would refuse whatever the grip; absent when it
   * never asks.
   *
   * @param ahead What is known of this action before it is planned, and the
   *   grip weighed.
   * @returns The poses the action demands of the grip.
   */
  demands?(
    ahead: IAutoMovieMotionHumanActionLaw.IAhead<P>,
  ): readonly IAutoMovieMotionHumanActionLaw.IDemand[];

  /**
   * The held prop this action plants on the floor ahead as it is entered (a
   * vault's pole), read from its own parameters before it is planned, so the
   * action cut into it carries the prop down to the plant over its last strides
   * (`IAutoMovieMotionHumanActionContext.cut`), as a vaulter lowers the pole
   * through the run's last strides. Undefined when these parameters plant
   * nothing; absent when the action never plants.
   *
   * @param params The action's resolved parameters.
   * @returns The plant, or undefined.
   */
  plants?(params: P): IAutoMovieMotionHumanActionLaw.IPlant | undefined;
}

/** Contracts used by HumanActionRow.of, styled, StrikingHeld.follows. */
export namespace IAutoMovieMotionHumanActionLaw {
  /** A grip an earlier action is choosing, as the action asked would hold it. */
  export interface IGrip {
    /** The held prop's subject id. */
    prop: string;

    /** The hand that holds it. */
    side: AutoMovieHumanSide;

    /**
     * The prop as a tool in that grip, read as `StrikingHeld.of` reads a held
     * one: its working point and edge by affordance id.
     *
     * @param points The working point's and the edge's affordance ids.
     * @returns The tool.
     */
    tool(
      points: IAutoMovieMotionHumanStrikingHeld.IPoints,
    ): IAutoMovieMotionHumanStrikingHeld.ITool;

    /**
     * The posture the earlier action leaves the body in with this grip, its
     * stance included: the posture the asked action is entered from.
     */
    posture: IAutoMovieMotionHumanPosture;
  }

  /**
   * A pose an action will hold a tool in: the arguments its plan judges the
   * pose by (`StrikingHeld.strayed`) and the most it lets the tool stray.
   */
  export interface IDemand {
    /**
     * The posture at the pose: the trunk, and the other limbs as the pose shows
     * them (a support hand's goal), which a fit couples with the holding arm.
     */
    posture: IAutoMovieMotionHumanPosture;

    /** The tool as the grip holds it, read with this action's own working point. */
    tool: IAutoMovieMotionHumanStrikingHeld.ITool;

    /** The holding hand's grip frame the pose asks. */
    frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame;

    /** The point of the tool the pose keeps, metres behind the working point. */
    back: number;

    /**
     * The most the fitted tool may stray from the pose, metres: the action's
     * own declared quality of it, the bound its plan refuses by.
     */
    bound: number;

    /**
     * A stray the action proved before any search, metres: a lower bound on
     * what any fit of the pose leaves, so the pose is judged no better (an
     * infeasibility certificate). None when absent.
     */
    least?: number;
  }

  /**
   * A held prop an action plants on the floor ahead as it is entered
   * (`IAutoMovieMotionHumanActionLaw.plants`).
   */
  export interface IPlant {
    /** The planted prop's subject id. */
    prop: string;

    /** The affordance id of the end planted on the floor. */
    end: string;

    /** The least lean of the prop from upright at the plant, degrees. */
    lean: number;
  }

  /**
   * What is known of an action before it is planned, as an earlier action
   * weighs a grip for it: its own parameters, the body, the skill, the props
   * and the aiming of the earlier action's context, the second the demand is
   * read at and the grip weighed, which carries the posture the action will be
   * entered from.
   */
  export type IAhead<P = object> = Pick<
    IAutoMovieMotionHumanActionContext<P>,
    "subject" | "body" | "params" | "skill" | "prop" | "aim"
  > & {
    /**
     * The film second the demand is read at: the earlier action's start, where
     * it reads the props and the targets too, since its own end is not known
     * before its grasp is chosen.
     */
    start: number;

    /** The grip weighed. */
    grip: IAutoMovieMotionHumanActionLaw.IGrip;
  };
}
