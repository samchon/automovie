import { AutoMovieEngineKinematics, AutoMovieEngineScheduleCut, AutoMovieScheduleError, Vector3, AutoMovieEngineMath, AutoMovieEngineSchedule } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieIntent, IAutoMovieIntentTiming, IAutoMovieMotionEvent, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanPerformanceState, IAutoMovieMotionHumanRefusal, IAutoMovieMotionHumanResponse, IAutoMovieMotionHumanSegment, IAutoMovieMotionMeeting, IAutoMovieSchedule, IAutoMovieScheduleAlignment, IAutoMovieScheduleContext, IAutoMovieScheduleCue, IAutoMovieScheduleEntry, IAutoMovieVector3 } from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanResponse } from "../../skill/internal/HumanResponse";
import { HumanSkill } from "../../skill/internal/HumanSkill";
import { HumanHitTrack } from "./HumanHitTrack";
import { HumanPerformanceContacts } from "./HumanPerformanceContacts";
import { HumanPerformanceOverlays } from "./HumanPerformanceOverlays";
import { HumanPerformancePlace } from "./HumanPerformancePlace";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanScheduleRefusal } from "./HumanScheduleRefusal";

/**
 * The composition resolved on the film clock: the engine's schedule resolver
 * given this performance's laws, the alignment of an action synced to an
 * instant, and the cut of an action at a proximity.
 */
export namespace HumanPerformanceSchedule {
  /**
   * Place the composition with the engine's resolver, every action planned by
   * its law. What the resolver cannot place (an anchor or an event the
   * composition names and does not have, an anchor used twice) reaches the
   * author as a located refusal with the names that exist.
   */
  export function resolve(
    self: IAutoMovieMotionHumanPerformanceState,
    input: IAutoMovieMotionHumanPerformance.IInput,
  ): IAutoMovieSchedule {
    try {
      return AutoMovieEngineSchedule.resolve(input.composition, {
        timing: (
          intent: IAutoMovieIntent,
          context: IAutoMovieScheduleContext,
        ): IAutoMovieIntentTiming => {
          const where: IAutoMovieMotionHumanRefusal.IWhere =
            HumanPerformanceRead.where(self, intent);
          // A read of a person whose actions a later part of an open group
          // holds places that part first, through the resolver's demand;
          // the previous timing's demand comes back after a nested one.
          const outer: IAutoMovieMotionHumanPerformanceState["demand"] =
            self.demand;
          const outerHorizon: IAutoMovieMotionHumanPerformanceState["horizon"] =
            self.horizon;
          const outerAnchored: IAutoMovieMotionHumanPerformanceState["demandAnchor"] =
            self.demandAnchor;
          const outerMeeting: IAutoMovieMotionHumanPerformanceState["meeting"] =
            self.meeting;
          self.demand = context.demand;
          self.horizon = context.horizon;
          self.demandAnchor = context.demandAnchor;
          self.meeting = context.meeting;
          try {
            return HumanRefusal.located(
              where,
              (): IAutoMovieIntentTiming =>
                HumanPerformancePlace.place(
                  self,
                  intent,
                  context.start,
                  context.entries,
                  where,
                ),
            );
          } finally {
            self.demand = outer;
            self.horizon = outerHorizon;
            self.demandAnchor = outerAnchored;
            self.meeting = outerMeeting;
          }
        },
        until: (
          intent: IAutoMovieIntent,
          placed: IResolvePlaced,
        ): number | undefined =>
          HumanPerformanceSchedule.proximity(self, intent, placed),
        state: (entry: IAutoMovieScheduleEntry): void => {
          const overlay: boolean = self.riding.has(entry.index);
          if (!overlay && entry.cut === undefined) return;
          const person: IAutoMovieMotionHumanSegment.IPerson =
            HumanPerformanceRead.person(self, entry.subject);
          if (overlay) HumanPerformanceOverlays.finish(person, entry);
          if (entry.cut !== undefined)
            HumanPerformanceContacts.cutHolds(person, entry.index, entry.end);
        },
        // A struck subject's hits are a track computed from what is placed.
        instants: (of: string): readonly IAutoMovieScheduleCue[] | undefined =>
          HumanHitTrack.instants(self, of),
        cues: {
          ...self.cues,
          ...Object.fromEntries(
            [...self.layered].filter(
              ([, cues]: [string, readonly IAutoMovieScheduleCue[]]): boolean =>
                cues.length !== 0,
            ),
          ),
        },
        align: (
          intent: IAutoMovieIntent,
          instant: string,
          target: number,
          context: IAutoMovieScheduleAlignment,
        ): number => {
          const where: IAutoMovieMotionHumanRefusal.IWhere =
            HumanPerformanceRead.where(self, intent);
          return HumanRefusal.located(where, (): number =>
            HumanPerformanceSchedule.align(
              self,
              intent,
              instant,
              target +
                HumanPerformanceSchedule.latency(self, intent, context, where),
              context,
              where,
            ),
          );
        },
      });
    } catch (error) {
      throw error instanceof AutoMovieScheduleError
        ? HumanScheduleRefusal(
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
   * target second. The time to that instant depends on the state the action is
   * entered from, which depends on when it starts, so it is planned at the
   * start found so far until that settles; nothing is placed.
   */
  export function align(
    self: IAutoMovieMotionHumanPerformanceState,
    intent: IAutoMovieIntent,
    instant: string,
    target: number,
    context: IAutoMovieScheduleAlignment,
    where: IAutoMovieMotionHumanRefusal.IWhere,
  ): number {
    const entries: readonly IAutoMovieScheduleEntry[] = context.entries;
    const person: IAutoMovieMotionHumanSegment.IPerson =
      HumanPerformanceRead.person(self, intent.subject);
    const previous: IAutoMovieMotionHumanSegment | undefined =
      intent.parameters?.over === true ? undefined : person.segments.at(-1);
    const floor: number = Math.max(0, previous?.entryTime ?? 0);
    let start: number = target;
    let lead: number = 0;

    // The start is the fixed point of planning at a start and moving it by
    // the lead that plan gives. It lies between the floor and the target, so
    // a map that settles at least as fast as a bisection of that span meets
    // the schedule's resolution (`CUT`) within as many rounds as halvings of
    // the span down to it; a start still moving by more after them refuses.
    const rounds: number =
      Math.ceil(Math.log2(Math.max(1, Math.abs(target - floor) / CUT))) + 1;
    let moved: number = Infinity;
    for (let round: number = 0; round < rounds; ++round) {
      // Planning a mutual action records its meeting; a trial must not.
      const meetings: [string, IAlignMeetingsItem][] = [...self.meetings];
      const timing: IAutoMovieIntentTiming = HumanPerformancePlace.place(
        self,
        intent,
        Math.max(floor, start),
        entries,
        where,
        true,
      );

      // The meetings this planning recorded go with its kept plan, for the
      // placement that takes it (`IAutoMovieMotionHumanPerformanceTrial`).
      if (self.trial !== undefined)
        self.trial.meetings = [...self.meetings].filter(
          ([key, value]: [string, IAlign]): boolean =>
            !meetings.some(
              ([before, kept]: [string, IAlign2]): boolean =>
                before === key && kept === value,
            ),
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

      // A plan is a function of the start it is planned at: a round that
      // asks for the start it was planned at has settled, and planning it
      // there again would give the same lead.
      const planned: number = Math.max(floor, start);
      start = target - lead;
      moved = Math.abs(Math.max(floor, start) - planned);
      if (moved === 0) break;
    }
    if (!(moved <= CUT))
      throw new HumanRefusal({
        kind: "cut",
        axis: "sync",
        value: target,
        feasible: null,
        reason: `${intent.capability}'s time to its ${instant} changes with its start and did not settle: after ${rounds} rounds its start still moved ${moved.toExponential(2)} s`,
        fix: "sync it to an instant its performer reaches at rest, or give the action before it more time",
      });
    if (start < floor - 1e-9) {
      // The instants of the same name the anchor or track still offers: the
      // first one late enough is what the author can sync to instead.
      const anchor: IAutoMovieScheduleAlignment["anchor"] = context.anchor;
      const same: readonly IAutoMovieScheduleCue[] =
        anchor.event === undefined
          ? []
          : anchor.instants.filter(
              (cue: IAutoMovieScheduleCue): boolean =>
                cue.name === anchor.event,
            );
      const earliest: number = same.findIndex(
        (cue: IAutoMovieScheduleCue): boolean =>
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

  /**
   * The drawn latency a synced action waits after its instant
   * (`HumanChainCore.ISync.latency`), 0 for an action synced without one: the
   * performer's own draw (`HumanResponse.latency`), keyed by the performer, the
   * action's id, its occurrence and `latency`, and warned when the cue track
   * holds the instant's preparatory word (`HumanCue.orders`).
   */
  export function latency(
    self: IAutoMovieMotionHumanPerformanceState,
    intent: IAutoMovieIntent,
    context: IAutoMovieScheduleAlignment,
    where: IAutoMovieMotionHumanRefusal.IWhere,
  ): number {
    const raw: unknown = intent.parameters?.latency;
    const kind: IAutoMovieMotionHumanResponse.Latency | undefined =
      raw === "reaction"
        ? "reaction"
        : typeof raw === "object" &&
            raw !== null &&
            "mean" in raw &&
            "spread" in raw
          ? { mean: Number(raw.mean), spread: Number(raw.spread) }
          : undefined;
    if (kind === undefined) return 0;
    const person: IAutoMovieMotionHumanSegment.IPerson =
      HumanPerformanceRead.person(self, intent.subject);
    const event: string | undefined = context.anchor.event;
    const index: number = context.anchor.index ?? 0;
    const warned: boolean =
      event !== undefined &&
      context.anchor.instants.filter(
        (cue: IAutoMovieScheduleCue): boolean => cue.name === `${event}Caution`,
      ).length > index;
    return HumanResponse.latency(
      person.skill,
      HumanSkill.stream(
        person.skill,
        intent.subject,
        intent.anchor ?? intent.capability,
        where.instance,
        "latency",
      ),
      kind,
      warned,
      person.performer.attributes,
    );
  }

  /**
   * The bracket width at which a proximity cut's second is taken, seconds: the
   * width the search it replaces reached, twenty halvings of a 24 Hz frame (`1
   * / 24 / 2 ** 20`, about 4e-8 s), so a cut is placed no more coarsely than
   * before.
   */
  export const CUT: number = 1 / 24 / 2 ** 20;

  /**
   * The share of the latest segment's active span at which a proximity cut
   * happens: the 24 Hz grid is scanned for the first frame within the distance,
   * and the crossing is found between it and the frame before by the Illinois
   * false-position search (`bracketedRoot`) to `CUT` seconds. Each reading
   * demands only the effector's bone of the performer's displayed bones.
   */
  export function proximity(
    self: IAutoMovieMotionHumanPerformanceState,
    intent: IAutoMovieIntent,
    placed: IProximityPlaced,
  ): number | undefined {
    const until =
      intent.until === undefined
        ? undefined
        : AutoMovieEngineScheduleCut.normalize(intent.until);
    if (until?.type !== "proximity") return undefined;
    const person: IAutoMovieMotionHumanSegment.IPerson =
      HumanPerformanceRead.person(self, intent.subject);

    // A proximity cut reads the carrier's reach; an overlay's is not found.
    if (intent.parameters?.over === true) return undefined;
    const segment: IAutoMovieMotionHumanSegment = person.segments.at(-1)!;
    const frame =
      person.performer.body.surfaces.regions[until.proximity.effector];

    // The effector's bone alone is read at each second: the bone demand
    // keeps that bone's displayed frame and computes no other bone.
    const demanded: ReadonlySet<AutoMovieHumanoidBone> = new Set([frame.bone]);
    const gap = (seconds: number): number => {
      const effector: IAutoMovieVector3 =
        AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
          frame,
          HumanPerformanceRead.bones(
            self,
            intent.subject,
            seconds,
            demanded,
          ).get(frame.bone)!,
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
    let clear: number = gap(previous);
    if (clear <= 0) return 0;
    // The grid's last sample is the span's own end, so a gap that closes
    // inside the final partial step is still found.
    for (let k: number = 1; previous < end; k++) {
      const t: number = Math.min(end, placed.start + k * step);
      const reached: number = gap(t);
      if (reached <= 0) {
        // The cut is the latest second measured within the distance, the
        // bracket's near end, so the action is never cut while still short
        // of it. The two ends are the scan's own readings.
        const ends: readonly [number, number, number, number] = [
          previous,
          clear,
          t,
          reached,
        ];
        let within: number = t;
        AutoMovieEngineMath.bracketedRoot(
          (seconds: number): number => {
            if (seconds === ends[0]) return ends[1];
            if (seconds === ends[2]) return ends[3];
            const at: number = gap(seconds);
            if (at <= 0) within = seconds;
            return at;
          },
          ends[0],
          ends[2],
          HumanPerformanceSchedule.CUT,
        );
        return placed.duration === 0
          ? 0
          : (within - placed.start) / placed.duration;
      }
      previous = t;
      clear = reached;
    }
    return undefined;
  }
}

/** The record of `IProximityPlaced`'s site. */
type IProximityPlaced = { start: number; duration: number };

/** The record of `IAlign2`'s site. */
type IAlign2 = { subject: string; meeting: IAutoMovieMotionMeeting };

/** The record of `IAlign`'s site. */
type IAlign = { subject: string; meeting: IAutoMovieMotionMeeting };

/** The record of `IAlignMeetingsItem`'s site. */
type IAlignMeetingsItem = { subject: string; meeting: IAutoMovieMotionMeeting };

/** The record of `IResolvePlaced`'s site. */
type IResolvePlaced = { start: number; duration: number };
