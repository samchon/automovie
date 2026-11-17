import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { AutoMovieMotionHumanActionKey } from "../AutoMovieMotionHumanActionKey";
import type { AutoMovieMotionHumanChannelClaim } from "../compose/AutoMovieMotionHumanChannelClaim";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanStrikingHeld } from "../striking/IAutoMovieMotionHumanStrikingHeld";
import type { IAutoMovieMotionHumanActionContext } from "./IAutoMovieMotionHumanActionContext";
import type { IAutoMovieMotionHumanActionPlan } from "./IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanInterruptRow } from "./IAutoMovieMotionHumanInterruptRow";

/**
 * One human action as a deterministic law: given its context (the body, the
 * parameters, the skill, the state it is entered from and its targets) it
 * plans its timing, events and contacts once, and its plan gives the posture
 * at any second as a pure function.
 *
 * `interrupts` is the action's closed cancel table, keyed by the action it
 * may cut into: only a cut that falls inside a listed window is legal, and
 * an undeclared cut is refused when the performance is built, with the legal
 * windows in the message, the way fighting-game cancel tables and Unity's
 * interruption sources fire only declared transitions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation family: The action this one is a row of: the same law under another name with some of its parameters fixed, as a salute is a touch. Wherever an action is told apart by what it is (a cancel table's key, a follow-up that continues its own kind, an answer to a kind of attack), a row counts as its family. Absent for an action that is its own. yields: The channels this action lets an overlay take while it carries the body: a walk yields its arms, its hands and its head, so a wave or a phone can be performed during it. A digit yields that digit alone, so an overlay may take a thumb while the other four keep holding. None when absent. demands: The poses this action will hold a prop in, asked before it is planned of the grips an earlier action is still choosing among (`pickUp`): the action's goal postures, computed from its own parameters by the functions its plan reads, so a grip the earlier action takes for them is one this action holds (goal postures planned first, Rosenbaum, Meulenbroek, Vaughan and Jansen 2001; a task's goal pose as a grasp's constraint). Nothing is planned: the action reads only what is known before it is, with the grip weighed (`IAutoMovieMotionHumanActionLaw.IAhead`). Empty when the action asks nothing of the grip, or would refuse whatever the grip; absent when it never asks. back: The point of the tool the pose keeps, metres behind the working point. bound: The most the fitted tool may stray from the pose, metres: the action's own declared quality of it, the bound its plan refuses by. least: A stray the action proved before any search, metres: a lower bound on what any fit of the pose leaves, so the pose is judged no better (an infeasibility certificate). None when absent.
 * @evidence contracts/development/design.md#principled-representation family: The action this one is a row of: the same law under another name with some of its parameters fixed, as a salute is a touch. Wherever an action is told apart by what it is (a cancel table's key, a follow-up that continues its own kind, an answer to a kind of attack), a row counts as its family. Absent for an action that is its own. yields: The channels this action lets an overlay take while it carries the body: a walk yields its arms, its hands and its head, so a wave or a phone can be performed during it. A digit yields that digit alone, so an overlay may take a thumb while the other four keep holding. None when absent. demands: The poses this action will hold a prop in, asked before it is planned of the grips an earlier action is still choosing among (`pickUp`): the action's goal postures, computed from its own parameters by the functions its plan reads, so a grip the earlier action takes for them is one this action holds (goal postures planned first, Rosenbaum, Meulenbroek, Vaughan and Jansen 2001; a task's goal pose as a grasp's constraint). Nothing is planned: the action reads only what is known before it is, with the grip weighed (`IAutoMovieMotionHumanActionLaw.IAhead`). Empty when the action asks nothing of the grip, or would refuse whatever the grip; absent when it never asks. back: The point of the tool the pose keeps, metres behind the working point. bound: The most the fitted tool may stray from the pose, metres: the action's own declared quality of it, the bound its plan refuses by. least: A stray the action proved before any search, metres: a lower bound on what any fit of the pose leaves, so the pose is judged no better (an infeasibility certificate). None when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: law/HumanActionRow.ts (HumanActionRow.of, law); law/HumanActionRow.ts (HumanActionRow.of, return); lexicon/HumanGait.ts (styled, return); lexicon/HumanSword.ts (HumanSword.follows, return); lexicon/HumanWeaponPresent.ts (HumanWeaponPresent.from, return); lexicon/HUMAN_LEXICON.ts (rows, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieMotionHumanActionKey, IAutoMovieMotionHumanInterruptRow, AutoMovieMotionHumanChannelClaim, IAutoMovieMotionHumanActionContext identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. Shares the canonical AutoMovieHumanSide, IAutoMovieMotionHumanStrikingHeld.IPoints, IAutoMovieMotionHumanStrikingHeld.ITool, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanStrikingHeld.IHandFrame identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export interface IAutoMovieMotionHumanActionLaw<P = object> {
  /** The action's name: a vocabulary name, or the name a production registers the law under. */
  name: AutoMovieMotionHumanActionKey;

  /**
   * The action this one is a row of: the same law under another name with
   * some of its parameters fixed, as a salute is a touch. Wherever an action
   * is told apart by what it is (a cancel table's key, a follow-up that
   * continues its own kind, an answer to a kind of attack), a row counts as
   * its family. Absent for an action that is its own.
   */
  family?: AutoMovieMotionHumanActionKey;

  /**
   * The parameters the plan reads, from those the composition gave: a row
   * adds its fixed ones. The performance records and passes on the result,
   * so whatever reads a placed action's parameters reads the whole set.
   *
   * @param given The parameters the composition gave.
   * @returns The parameters planned from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionLaw.resolve: The parameters the plan reads, from those the composition gave: a row adds its fixed ones. The performance records and passes on the result, so whatever reads a placed action's parameters reads the whole set.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionLaw.resolve is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionLaw.resolve is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionLaw.resolve is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionLaw.resolve is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionLaw.resolve is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionLaw.resolve is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   */
  resolve?(given: object): object;

  /**
   * The cancel table: target action to the windows a cut may use. The key
   * `any` gives the windows a cut into every action may use, for an action
   * a person can leave for anything, as quiet standing is.
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
   * The channels this action lets an overlay take while it carries the body:
   * a walk yields its arms, its hands and its head, so a wave or a phone can
   * be performed during it. A digit yields that digit alone, so an overlay
   * may take a thumb while the other four keep holding. None when absent.
   */
  yields?: readonly AutoMovieMotionHumanChannelClaim[];

  /**
   * Whether the action can be performed over a carrier (`HumanChain.over`):
   * it plans on the carrier's posture and claims only the channels its plan
   * names. An action that moves the whole body cannot.
   */
  overlay?: boolean;

  /**
   * Plan one instance of the action.
   *
   * @param context Body, parameters, skill, entry state and targets.
   * @returns The plan, whose postures are pure functions of seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionLaw.plan: Plan one instance of the action.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionLaw.plan is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionLaw.plan is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionLaw.plan is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionLaw.plan is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionLaw.plan is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionLaw.plan is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   */
  plan(
    context: IAutoMovieMotionHumanActionContext<P>,
  ): IAutoMovieMotionHumanActionPlan;

  /**
   * The poses this action will hold a prop in, asked before it is planned
   * of the grips an earlier action is still choosing among (`pickUp`): the
   * action's goal postures, computed from its own parameters by the
   * functions its plan reads, so a grip the earlier action takes for them is
   * one this action holds (goal postures planned first, Rosenbaum,
   * Meulenbroek, Vaughan and Jansen 2001; a task's goal pose as a grasp's
   * constraint). Nothing is planned: the action reads only what is known
   * before it is, with the grip weighed (`IAutoMovieMotionHumanActionLaw.IAhead`). Empty
   * when the action asks nothing of the grip, or would refuse whatever the
   * grip; absent when it never asks.
   *
   * @param ahead What is known of this action before it is planned, and the grip weighed.
   * @returns The poses the action demands of the grip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionLaw.demands: The poses this action will hold a prop in, asked before it is planned of the grips an earlier action is still choosing among (`pickUp`): the action's goal postures, computed from its own parameters by the functions its plan reads, so a grip the earlier action takes for them is one this action holds (goal postures planned first, Rosenbaum, Meulenbroek, Vaughan and Jansen 2001; a task's goal pose as a grasp's constraint). Nothing is planned: the action reads only what is known before it is, with the grip weighed (`IAutoMovieMotionHumanActionLaw.IAhead`). Empty when the action asks nothing of the grip, or would refuse whatever the grip; absent when it never asks.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionLaw.demands is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionLaw.demands is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionLaw.demands is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionLaw.demands is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionLaw.demands is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionLaw.demands is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   */
  demands?(
    ahead: IAutoMovieMotionHumanActionLaw.IAhead<P>,
  ): readonly IAutoMovieMotionHumanActionLaw.IDemand[];
}

/**
 * Contracts used by HumanActionRow.of, styled, HumanSword.follows.
 *
 */
export namespace IAutoMovieMotionHumanActionLaw {
  /**
   * A grip an earlier action is choosing, as the action asked would hold it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it is.
   * @evidence contracts/development/design.md#principled-representation The prop, the hand, the tool the grip would hold, read as a held tool is, and the body as the grasp leaves it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, what a demanding action reads of a grip.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The tool is read by its own affordances; no prop is named.
   */
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
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionLaw.IGrip.tool: The prop as a tool in that grip, read as `StrikingHeld.of` reads a held one: its working point and edge by affordance id.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionLaw.IGrip.tool is used through packages/motions/src/perform/HumanPerformancePlace.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionLaw.IGrip.tool is used through packages/motions/src/perform/HumanPerformancePlace.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionLaw.IGrip.tool is used through packages/motions/src/perform/HumanPerformancePlace.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionLaw.IGrip.tool is used through packages/motions/src/perform/HumanPerformancePlace.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionLaw.IGrip.tool is used through packages/motions/src/perform/HumanPerformancePlace.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionLaw.IGrip.tool is used through packages/motions/src/perform/HumanPerformancePlace.ts.
     */
    tool(
      points: IAutoMovieMotionHumanStrikingHeld.IPoints,
    ): IAutoMovieMotionHumanStrikingHeld.ITool;

    /** The posture the earlier action leaves the body in with this grip, its stance included: the posture the asked action is entered from. */
    posture: IAutoMovieMotionHumanPosture;
  }

  /**
   * A pose an action will hold a tool in: the arguments its plan judges the
   * pose by (`StrikingHeld.strayed`) and the most it lets the tool stray.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The arguments of the held-tool measure the action's refusal reads, on the posture it shows, with the bound it refuses by.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, every argument of that refusal and an optional proven lower bound.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The bound is the action's own; none is picked by the reader.
   */
  export interface IDemand {
    /** The posture at the pose: the trunk, and the other limbs as the pose shows them (a support hand's goal), which a fit couples with the holding arm. */
    posture: IAutoMovieMotionHumanPosture;

    /** The tool as the grip holds it, read with this action's own working point. */
    tool: IAutoMovieMotionHumanStrikingHeld.ITool;

    /** The holding hand's grip frame the pose asks. */
    frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame;

    /** The point of the tool the pose keeps, metres behind the working point. */
    back: number;

    /** The most the fitted tool may stray from the pose, metres: the action's own declared quality of it, the bound its plan refuses by. */
    bound: number;

    /** A stray the action proved before any search, metres: a lower bound on what any fit of the pose leaves, so the pose is judged no better (an infeasibility certificate). None when absent. */
    least?: number;
  }

  /**
   * What is known of an action before it is planned, as an earlier action
   * weighs a grip for it: its own parameters, the body, the skill, the props
   * and the aiming of the earlier action's context, the second the demand is
   * read at and the grip weighed, which carries the posture the action will
   * be entered from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is known and why nothing else is.
   * @evidence contracts/development/design.md#principled-representation The context's members that do not depend on the action being planned, with the second it is read at and the grip, whose posture is the entry an earlier action predicts for it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What a demanding action reads before it is planned.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No other action's entry, start or posture stands in for this one's.
   */
  export type IAhead<P = object> = Pick<
    IAutoMovieMotionHumanActionContext<P>,
    "subject" | "body" | "params" | "skill" | "prop" | "aim"
  > & {
    /** The film second the demand is read at: the earlier action's start, where it reads the props and the targets too, since its own end is not known before its grasp is chosen. */
    start: number;

    /** The grip weighed. */
    grip: IAutoMovieMotionHumanActionLaw.IGrip;
  };
}
