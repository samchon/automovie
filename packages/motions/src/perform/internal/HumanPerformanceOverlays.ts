import type {
  AutoMovieMotionHumanActionKey,
  AutoMovieMotionHumanChannelClaim,
  IAutoMovieIntent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanSegment,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";

import { AutoMovieMotionHumanChannel as HumanChannels } from "../../compose/internal/AutoMovieMotionHumanChannel";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanPerformanceContacts } from "./HumanPerformanceContacts";

/** The record of `IPlaceResult`'s site. */
type IPlaceResult = {
  duration: number;
  contact?: number;
  events: IPlaceEventsItemResult[];
};

/** The record of `IPlaceEventsItemResult`'s site. */
type IPlaceEventsItemResult = { name: string; share: number };

/**
 * A planned action placed over its carrier: the channels it claims checked
 * against what the carrier yields and what the other overlays of the same span
 * hold, and the overlay added to its performer. Once the schedule is placed,
 * carriers with instance-specific yields protect their channels for their
 * entire active span.
 */
export namespace HumanPerformanceOverlays {
  /** A planned action as `HumanPerformancePlace.place` hands it over. */
  export interface IPlanned {
    /** The action's name. */
    name: AutoMovieMotionHumanActionKey;

    /** The parameters it was planned from. */
    params: object;

    /** Its law. */
    law: IAutoMovieMotionHumanActionLaw<never>;

    /** The context it was planned in. */
    context: IAutoMovieMotionHumanActionContext<never>;

    /** Its plan. */
    plan: IAutoMovieMotionHumanActionPlan;

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
   * @returns The overlay's timing for the schedule: its duration, its contact
   *   instant when it has one, and its events.
   * @throws {HumanRefusal} When the carrier keeps a claimed channel or a held
   *   prop prevents the overlay from using its hand.
   */
  export function place(
    self: IAutoMovieMotionHumanPerformanceState,
    person: IAutoMovieMotionHumanSegment.IPerson,
    carrier: IAutoMovieMotionHumanSegment,
    intent: IAutoMovieIntent,
    entries: readonly IAutoMovieScheduleEntry[],
    planned: IPlanned,
  ): IPlaceResult {
    const { name, params, law, context, plan, start }: IPlanned = planned;
    // The carrier must yield the channels claimed at entry.
    const channels: readonly AutoMovieMotionHumanChannelClaim[] =
      plan.channels ?? [];
    requireYielded(carrier, name, channels);
    const end: number = start + plan.duration;
    const overlay: IAutoMovieMotionHumanSegment.IOverlay = {
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

  /**
   * Publish the just-placed overlay's scheduled end and check its claims
   * against earlier placements over the actual shared interval.
   *
   * @param person The performer whose last overlay was just scheduled.
   * @param entry The scheduled overlay, including its resolved end in film
   *   seconds.
   * @throws {HumanRefusal} When both overlays use a channel during a shared
   *   span.
   */
  export function finish(
    person: IAutoMovieMotionHumanSegment.IPerson,
    entry: IAutoMovieScheduleEntry,
  ): void {
    const overlay: IAutoMovieMotionHumanSegment.IOverlay =
      person.overlays.at(-1)!;
    overlay.end = entry.end;
    for (let i: number = 0; i < overlay.index; ++i) {
      const other: IAutoMovieMotionHumanSegment.IOverlay = person.overlays[i]!;
      const start: number = Math.max(overlay.entryTime, other.entryTime);
      if (Math.min(overlay.end, other.end) <= start + 1e-9) continue;

      const shared: AutoMovieMotionHumanChannelClaim[] =
        overlay.channels.filter(
          (c: AutoMovieMotionHumanChannelClaim): boolean =>
            HumanChannels.claims(other.channels, c) ||
            other.channels.some(
              (o: AutoMovieMotionHumanChannelClaim): boolean =>
                HumanChannels.claims([c], o),
            ),
        );
      if (shared.length !== 0)
        throw locate(
          person,
          overlay,
          new HumanRefusal({
            kind: "channel",
            axis: "over",
            value: shared,
            reason: `${overlay.name} claims ${overlay.channels.join(", ")} while ${other.name} (${other.id}) claims ${other.channels.join(", ")}: both take ${shared.join(", ")} from ${start.toFixed(2)} s`,
            fix: `give one of them the other hand, or let ${other.name} end first (put ${overlay.name} after it in the same overlay)`,
          }),
          entry.intent.capability,
        );
    }
  }

  /**
   * Check the active spans of carriers that specify their own channel
   * ownership. Placement can add or cut another action after admitting an
   * overlay.
   *
   * @param person The performer with every action and overlay placed.
   * @throws {HumanRefusal} When an overlay still running claims a channel the
   *   new carrier needs.
   */
  export function validate(person: IAutoMovieMotionHumanSegment.IPerson): void {
    const overlays: IAutoMovieMotionHumanSegment.IOverlay[] = [
      ...person.overlays,
    ].sort((a, b): number => a.entryTime - b.entryTime || a.entry - b.entry);
    const active: Set<IAutoMovieMotionHumanSegment.IOverlay> = new Set();
    let cursor: number = 0;
    for (const [index, carrier] of person.segments.entries()) {
      const next: number = person.segments[index + 1]?.entryTime ?? Infinity;
      if (next <= carrier.entryTime || carrier.plan.yields === undefined)
        continue;

      while (cursor < overlays.length && overlays[cursor]!.entryTime < next) {
        const overlay: IAutoMovieMotionHumanSegment.IOverlay =
          overlays[cursor++]!;
        if (overlay.end > carrier.entryTime + 1e-9) active.add(overlay);
      }
      for (const overlay of active) {
        if (overlay.end <= carrier.entryTime + 1e-9) {
          active.delete(overlay);
          continue;
        }
        const start: number = Math.max(carrier.entryTime, overlay.entryTime);
        const end: number = Math.min(next, overlay.end);
        if (end <= start + 1e-9) continue;

        try {
          requireYielded(carrier, overlay.name, overlay.channels);
        } catch (error) {
          if (!(error instanceof HumanRefusal)) throw error;
          throw locate(person, overlay, error);
        }
      }
    }
  }

  /** Locate a refusal by the overlay's placement order among actions of its id. */
  function locate(
    person: IAutoMovieMotionHumanSegment.IPerson,
    overlay: IAutoMovieMotionHumanSegment.IOverlay,
    error: HumanRefusal,
    act: AutoMovieMotionHumanActionKey = overlay.name,
  ): ReturnType<HumanRefusal["locate"]> {
    return error.locate({
      performer: person.performer.subject,
      act,
      instance:
        1 +
        [...person.segments, ...person.overlays].filter(
          (entry: IAutoMovieMotionHumanSegment): boolean =>
            entry.id === overlay.id && entry.entry < overlay.entry,
        ).length,
    });
  }

  /** Refuses a claimed channel that the carrier keeps for itself. */
  function requireYielded(
    carrier: IAutoMovieMotionHumanSegment,
    name: AutoMovieMotionHumanActionKey,
    channels: readonly AutoMovieMotionHumanChannelClaim[],
  ): void {
    const yielded: readonly AutoMovieMotionHumanChannelClaim[] =
      carrier.plan.yields ?? carrier.law.yields ?? [];

    // A yielded hand covers its digits. Yielding one digit does not give
    // up the rest of the hand.
    const kept: AutoMovieMotionHumanChannelClaim[] = channels.filter(
      (c: AutoMovieMotionHumanChannelClaim): boolean =>
        !HumanChannels.claims(yielded, c),
    );
    if (kept.length !== 0)
      throw new HumanRefusal({
        kind: "channel",
        axis: "over",
        value: kept,
        feasible: { kind: "alternatives", values: [...yielded] },
        reason: `${name} claims ${channels.join(", ")}, and ${carrier.name} (${carrier.id}) keeps ${kept.join(", ")} for itself (it yields ${yielded.join(", ") || "nothing"})`,
        fix: `end ${name} before ${carrier.name} begins, use a yielded channel, or perform ${name} as an action of its own`,
      });
  }
}
