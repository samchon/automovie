import type { IHumanActionContext } from "./IHumanActionContext";
import type { IHumanActionLaw } from "./IHumanActionLaw";
import type { IHumanActionPlan } from "./IHumanActionPlan";

/**
 * A row: a shipped or registered action under a name of its own, with some
 * of its parameters fixed. A salute is a touch of the fingertips to the
 * brow; a toast is a drink held high.
 *
 * A row is the cheapest way to extend the vocabulary, because it writes no
 * motion: the action it is a row of plans it, so it is fitted to the body,
 * refused and checked exactly as that action is. It cuts and is cut like
 * that action, is performed over a carrier where that action can be, and a
 * follow-up or an answer that tells actions apart by kind reads it as that
 * action. Its seeded draws are its own name's, so the same film with the
 * row and with the action written out are two takes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a row is, what it inherits and how its draws are keyed.
 * @evidence contracts/development/design.md#principled-representation A row is a law record: the owner's plan, cancel tables and channels under another name, with the owner as its family and the fixed parameters merged by `resolve`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One constructor.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No action is copied; the owner's members are referenced.
 */
export namespace HumanActionRow {
  /**
   * Name a row of an action.
   *
   * @param name The row's name, as the composition will call it.
   * @param law The action it is a row of.
   * @param fixed The parameters the row fixes; the composition gives the rest.
   * @returns The row's law, to register with a performance and a chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three inputs and what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation The fixed parameters override the given ones, then pass through the owner's own `resolve`, so a row of a row resolves to the first owner's parameters and family.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record built from the owner's members.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Optional members are copied only when the owner declares them.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to cache: the record is built once per row.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds the owner and the fixed parameters for as long as the row is held.
   */
  export function of<P extends object, Fixed extends keyof P>(
    name: string,
    law: IHumanActionLaw<P>,
    fixed: Pick<P, Fixed>,
  ): IHumanActionLaw<Omit<P, Fixed>> {
    const resolve = (given: object): object => {
      const merged: object = { ...given, ...fixed };
      return law.resolve?.(merged) ?? merged;
    };
    return {
      name,
      family: law.family ?? law.name,
      resolve,
      interrupts: law.interrupts,
      ...(law.accepts === undefined ? {} : { accepts: law.accepts }),
      ...(law.yields === undefined ? {} : { yields: law.yields }),
      ...(law.overlay === undefined ? {} : { overlay: law.overlay }),
      plan: (context: IHumanActionContext<Omit<P, Fixed>>): IHumanActionPlan =>
        law.plan(context as unknown as IHumanActionContext<P>),
    };
  }
}
