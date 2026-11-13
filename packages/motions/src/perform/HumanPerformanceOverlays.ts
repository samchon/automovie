import type { IAutoMovieIntent, IAutoMovieSchedule } from "@automovie/engine";

import type { HumanActionKey } from "../HumanActionKey";
import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanPerformanceContacts } from "./HumanPerformanceContacts";
import type { HumanPerformanceState } from "./HumanPerformanceState";
import type { HumanSegment } from "./HumanSegment";

/**
 * A planned action placed over its carrier: the channels it claims checked
 * against what the carrier yields and what the other overlays of the same
 * span hold, and the overlay added to its performer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is checked and what is added.
 * @evidence contracts/development/design.md#principled-representation An overlay is a placed action with the channels it takes from its carrier, exclusive among the overlays that run with it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one function `HumanPerformancePlace.place` calls for an intent placed over another; split from it unchanged.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A channel the carrier keeps or another overlay holds is refused, never shared.
 */
export namespace HumanPerformanceOverlays {
  /**
   * A planned action as `HumanPerformancePlace.place` hands it over.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it is.
   * @evidence contracts/development/design.md#principled-representation The facts of one planned action that an overlay record is built from.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, each read by `place`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The plan and the context are the ones the law made, passed on unchanged.
   */
  export interface IPlanned {
    /** The action's name. */
    name: HumanActionKey;

    /** The parameters it was planned from. */
    params: object;

    /** Its law. */
    law: IHumanActionLaw<never>;

    /** The context it was planned in. */
    context: IHumanActionContext<never>;

    /** Its plan. */
    plan: IHumanActionPlan;

    /** Film second it starts. */
    start: number;
  }

  /**
   * Place a planned action over its carrier.
   *
   * @param self The performance's state.
   * @param person The performer.
   * @param carrier The action that carries the body at the overlay's start.
   * @param intent The intent placed.
   * @param entries The schedule entries placed so far.
   * @param planned The planned action.
   * @returns The overlay's timing for the schedule: its duration, its contact instant when it has one, and its events.
   * @throws {HumanRefusal} When the plan claims a channel the carrier does not yield, or one another overlay of the same span holds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, the result and both refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The claimed channels are the plan's own; the carrier's yields and the running overlays' claims bound them, and the hold of a prop passes to the overlay as it does to any placed action.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two checks, one record, its registration.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both conflicts throw with the channels at fault and the repair.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates the hold to `HumanPerformanceContacts.hold`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the performer's overlays.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The overlay record is owned by its performer.
   */
  export function place(
    self: HumanPerformanceState,
    person: HumanSegment.IPerson,
    carrier: HumanSegment.ISegment,
    intent: IAutoMovieIntent,
    entries: readonly IAutoMovieSchedule.IEntry[],
    planned: IPlanned,
  ): {
    duration: number;
    contact?: number;
    events: { name: string; share: number }[];
  } {
    const { name, params, law, context, plan, start }: IPlanned = planned;
    // The overlay takes what its plan claims, which the carrier must yield
    // and no other overlay of the same span may hold.
    const channels: readonly AutoMovieMotionHumanChannel[] =
      plan.channels ?? [];
    const yielded: readonly AutoMovieMotionHumanChannel[] =
      carrier.law.yields ?? [];
    const kept: AutoMovieMotionHumanChannel[] = channels.filter(
      (c: AutoMovieMotionHumanChannel): boolean => !yielded.includes(c),
    );
    if (kept.length !== 0)
      throw new HumanRefusal({
        kind: "channel",
        axis: "over",
        value: kept,
        feasible: { kind: "alternatives", values: [...yielded] },
        reason: `${name} claims ${channels.join(", ")}, and ${carrier.name} keeps ${kept.join(", ")} for itself (it yields ${yielded.join(", ") || "nothing"})`,
        fix: `perform ${name} over an action that yields those channels, or as an action of its own`,
      });
    const end: number = start + plan.duration;
    for (const other of person.overlays) {
      if (!(other.end > start + 1e-9 && other.entryTime < end - 1e-9)) continue;
      const shared: AutoMovieMotionHumanChannel[] = channels.filter(
        (c: AutoMovieMotionHumanChannel): boolean => other.channels.includes(c),
      );
      if (shared.length !== 0)
        throw new HumanRefusal({
          kind: "channel",
          axis: "over",
          value: shared,
          reason: `${name} claims ${channels.join(", ")} while ${other.name} (${other.id}) claims ${other.channels.join(", ")}: both take ${shared.join(", ")} from ${start.toFixed(2)} s`,
          fix: `give one of them the other hand, or let ${other.name} end first (put ${name} after it in the same overlay)`,
        });
    }
    const overlay: HumanSegment.IOverlay = {
      index: person.overlays.length,
      entry: entries.length,
      id: intent.anchor ?? name,
      name,
      params,
      law,
      context,
      plan,
      start,
      entryTime: start,
      end,
      channels,
    };
    HumanPerformanceContacts.hold(person, overlay, true);
    self.riding.add(entries.length);
    person.overlays.push(overlay);
    if (intent.anchor !== undefined)
      self.anchors.set(
        intent.anchor,
        Object.assign(overlay, { subject: intent.subject }),
      );
    return {
      duration: plan.duration,
      ...(plan.contact === undefined ? {} : { contact: plan.contact }),
      events: plan.events.map((e) => ({ name: e.name, share: e.share })),
    };
  }
}
