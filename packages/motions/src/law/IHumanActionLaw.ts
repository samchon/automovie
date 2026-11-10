import type { HumanActionName } from "../HumanActionName";
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
  /** The action's name. */
  name: HumanActionName;

  /** The cancel table: target action to the windows a cut may use. */
  interrupts: Partial<Record<HumanActionName, readonly IHumanInterruptRow[]>>;

  /**
   * Plan one instance of the action.
   *
   * @param context Body, parameters, skill, entry state and targets.
   * @returns The plan, whose postures are pure functions of seconds.
   */
  plan(context: IHumanActionContext<P>): IHumanActionPlan;
}
