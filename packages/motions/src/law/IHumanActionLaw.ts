import type { HumanActionKey } from "../HumanActionKey";
import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import type { IHumanActionContext } from "./IHumanActionContext";
import type { IHumanActionPlan } from "./IHumanActionPlan";
import type { IHumanInterruptRow } from "./IHumanInterruptRow";

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
 */
export interface IHumanActionLaw<P = object> {
  /** The action's name: a vocabulary name, or the name a production registers the law under. */
  name: HumanActionKey;

  /**
   * The cancel table: target action to the windows a cut may use. The key
   * `any` gives the windows a cut into every action may use, for an action
   * a person can leave for anything, as quiet standing is.
   */
  interrupts: Partial<
    Record<HumanActionKey | "any", readonly IHumanInterruptRow[]>
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
    Record<HumanActionKey | "any", readonly IHumanInterruptRow[]>
  >;

  /**
   * The channels this action lets an overlay take while it carries the body:
   * a walk yields its arms, its hands and its head, so a wave or a phone can
   * be performed during it. None when absent.
   */
  yields?: readonly AutoMovieMotionHumanChannel[];

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
   */
  plan(context: IHumanActionContext<P>): IHumanActionPlan;
}
