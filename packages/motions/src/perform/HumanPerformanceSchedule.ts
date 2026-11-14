import {
  AutoMovieScheduleError,
  type IAutoMovieIntent,
  type IAutoMovieSchedule,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
  resolveAutoMovieSchedule,
} from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieMotionMeeting } from "../compose/AutoMovieMotionMeeting";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanPerformance } from "./HumanPerformance";
import { HumanPerformancePlace } from "./HumanPerformancePlace";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import type { HumanPerformanceState } from "./HumanPerformanceState";
import { HumanScheduleRefusal } from "./HumanScheduleRefusal";
import { HumanSegment } from "./HumanSegment";

/**
 * The composition resolved on the film clock: the engine's schedule
 * resolver given this performance's laws, the alignment of an action synced
 * to an instant, and the cut of an action at a proximity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three things the functions do.
 * @evidence contracts/development/design.md#principled-representation The engine resolves the composition; this supplies what it asks for and turns its errors into located refusals.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The resolve, the alignment and the proximity search (#3399).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The engine stays vocabulary-free: every law is read here.
 */
export namespace HumanPerformanceSchedule {
  /**
   * Place the composition with the engine's resolver, every action planned
   * by its law. What the resolver cannot place (an anchor or an event the
   * composition names and does not have, an anchor used twice) reaches the
   * author as a located refusal with the names that exist.
   */
  export function resolve(
    self: HumanPerformanceState,
    input: HumanPerformance.IInput,
  ): IAutoMovieSchedule {
    try {
      return resolveAutoMovieSchedule(input.composition, {
        timing: (
          intent: IAutoMovieIntent,
          context: resolveAutoMovieSchedule.IContext,
        ): resolveAutoMovieSchedule.ITiming => {
          const where: HumanRefusal.IWhere = HumanPerformanceRead.where(
            self,
            intent,
          );
          try {
            return HumanPerformancePlace.place(
              self,
              intent,
              context.start,
              context.entries,
              where,
            );
          } catch (error) {
            throw error instanceof HumanRefusal ? error.locate(where) : error;
          }
        },
        until: (
          intent: IAutoMovieIntent,
          placed: { start: number; duration: number },
        ): number | undefined =>
          HumanPerformanceSchedule.proximity(self, intent, placed),
        cues: {
          ...self.cues,
          ...Object.fromEntries(
            [...self.layered].filter(
              ([, cues]: [
                string,
                readonly resolveAutoMovieSchedule.ICue[],
              ]): boolean => cues.length !== 0,
            ),
          ),
        },
        align: (
          intent: IAutoMovieIntent,
          instant: string,
          target: number,
          context: resolveAutoMovieSchedule.IAlignment,
        ): number => {
          const where: HumanRefusal.IWhere = HumanPerformanceRead.where(
            self,
            intent,
          );
          try {
            return HumanPerformanceSchedule.align(
              self,
              intent,
              instant,
              target,
              context,
              where,
            );
          } catch (error) {
            throw error instanceof HumanRefusal ? error.locate(where) : error;
          }
        },
      });
    } catch (error) {
      throw error instanceof AutoMovieScheduleError
        ? HumanScheduleRefusal.of(
            error,
            (subject: string, capability: string): number =>
              HumanPerformanceRead.where(self, { subject, capability })
                .instance,
          )
        : error;
    }
  }

  /**
   * The second an action must start at for one of its instants to fall on a
   * target second. The time to that instant depends on the state the action
   * is entered from, which depends on when it starts, so it is planned at
   * the start found so far until that settles; nothing is placed.
   */
  export function align(
    self: HumanPerformanceState,
    intent: IAutoMovieIntent,
    instant: string,
    target: number,
    context: resolveAutoMovieSchedule.IAlignment,
    where: HumanRefusal.IWhere,
  ): number {
    const entries: readonly IAutoMovieSchedule.IEntry[] = context.entries;
    const person: HumanSegment.IPerson = HumanPerformanceRead.person(
      self,
      intent.subject,
    );
    const previous: HumanSegment.ISegment | undefined =
      intent.parameters?.over === true ? undefined : person.segments.at(-1);
    const floor: number = Math.max(0, previous?.entryTime ?? 0);
    let start: number = target;
    let lead: number = 0;
    for (let round: number = 0; round < 3; ++round) {
      // Planning a mutual action records its meeting; a trial must not.
      const meetings: [
        string,
        { subject: string; meeting: AutoMovieMotionMeeting.IMeeting },
      ][] = [...self.meetings];
      const timing: resolveAutoMovieSchedule.ITiming =
        HumanPerformancePlace.place(
          self,
          intent,
          Math.max(floor, start),
          entries,
          where,
          true,
        );
      self.meetings.clear();
      for (const [key, value] of meetings) self.meetings.set(key, value);
      const share: number | undefined =
        (timing.events ?? []).find(
          (e: IAutoMovieMotionEvent): boolean => e.name === instant,
        )?.share ??
        (instant === "start" ? 0 : instant === "end" ? 1 : undefined);
      if (share === undefined)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "sync",
          value: instant,
          feasible: {
            kind: "alternatives",
            values: [
              "start",
              ...(timing.events ?? []).map(
                (e: IAutoMovieMotionEvent): string => e.name,
              ),
              "end",
            ],
          },
          reason: `${intent.capability} has no instant named ${instant}`,
          fix: "align one of the instants the action has",
        });
      lead = share * timing.duration;
      start = target - lead;
    }
    if (start < floor - 1e-9) {
      // The instants of the same name the anchor or track still offers: the
      // first one late enough is what the author can sync to instead.
      const anchor: resolveAutoMovieSchedule.IAlignment["anchor"] =
        context.anchor;
      const same: readonly resolveAutoMovieSchedule.ICue[] =
        anchor.event === undefined
          ? []
          : anchor.instants.filter(
              (cue: resolveAutoMovieSchedule.ICue): boolean =>
                cue.name === anchor.event,
            );
      const earliest: number = same.findIndex(
        (cue: resolveAutoMovieSchedule.ICue): boolean =>
          cue.seconds + anchor.offset >= floor + lead - 1e-9,
      );
      throw new HumanRefusal({
        kind: "cut",
        axis: "sync",
        value: target,
        feasible: {
          kind: "range",
          minimum: Math.ceil((floor + lead) * 1000) / 1000,
          maximum: null,
          unit: "s",
        },
        reason: `${intent.capability} takes ${lead.toFixed(2)} s to reach its ${instant}, so to put it at ${target.toFixed(2)} s it would start at ${start.toFixed(2)} s, before ${
          previous === undefined || floor === 0
            ? "the film begins"
            : `${previous.name} begins at ${floor.toFixed(2)} s`
        }`,
        fix:
          same.length === 0
            ? "sync it to an instant no earlier than the feasible minimum, or shorten what its performer does before it"
            : earliest < 0
              ? `none of the ${same.length} ${anchor.event} instants of ${anchor.of} is late enough: sync it to another anchor or track, or shorten what its performer does before it`
              : `sync it to ${anchor.event} index ${earliest} of ${anchor.of} (${same[earliest]!.seconds.toFixed(3)} s), the earliest it can meet, or shorten what its performer does before it`,
      });
    }
    return start;
  }

  /** The share of the latest segment's active span at which a proximity cut happens. */
  export function proximity(
    self: HumanPerformanceState,
    intent: IAutoMovieIntent,
    placed: { start: number; duration: number },
  ): number | undefined {
    const until = intent.until;
    if (until === undefined || !("proximity" in until)) return undefined;
    const person: HumanSegment.IPerson = HumanPerformanceRead.person(
      self,
      intent.subject,
    );

    // A proximity cut reads the carrier's reach; an overlay's is not found.
    if (intent.parameters?.over === true) return undefined;
    const segment: HumanSegment.ISegment = person.segments.at(-1)!;
    const frame =
      person.performer.body.surfaces.regions[until.proximity.effector];
    const gap = (seconds: number): number => {
      const effector: IAutoMovieVector3 =
        resolveAutoMovieHumanoidSurfaces.place(
          frame,
          HumanPerformanceRead.bones(self, intent.subject, seconds).get(
            frame.bone,
          )!,
        ).point;
      return (
        Vector3.length(
          Vector3.subtract(
            effector,
            segment.context.aim(until.proximity.target, seconds).point,
          ),
        ) - until.proximity.distance
      );
    };
    const step: number = 1 / 24;
    const end: number = placed.start + placed.duration;
    let previous: number = placed.start;
    if (gap(previous) <= 0) return 0;
    // The grid's last sample is the span's own end, so a gap that closes
    // inside the final partial step is still found.
    for (let k: number = 1; previous < end; k++) {
      const t: number = Math.min(end, placed.start + k * step);
      if (gap(t) <= 0) {
        let lo: number = previous;
        let hi: number = t;
        for (let i: number = 0; i < 20; i++) {
          const mid: number = (lo + hi) / 2;
          if (gap(mid) <= 0) hi = mid;
          else lo = mid;
        }
        return placed.duration === 0
          ? 0
          : (hi - placed.start) / placed.duration;
      }
      previous = t;
    }
    return undefined;
  }
}
