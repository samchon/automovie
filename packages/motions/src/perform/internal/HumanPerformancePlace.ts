import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  AutoMovieMotionHumanScheduledInstant,
  IAutoMovieIntent,
  IAutoMovieIntentTiming,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanForce,
  IAutoMovieMotionHumanObstacle,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPerformanceTrial,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionTarget,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";

import { prepareJumpPosture } from "../../actions/internal/prepareJumpPosture";
import { HumanRefusal } from "../../law/HumanRefusal";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanSkill } from "../../skill/internal/HumanSkill";
import { HumanForce } from "./HumanForce";
import { HumanPerformanceAhead } from "./HumanPerformanceAhead";
import { HumanPerformanceAim } from "./HumanPerformanceAim";
import { HumanPerformanceContacts } from "./HumanPerformanceContacts";
import { HumanPerformanceLayers } from "./HumanPerformanceLayers";
import { HumanPerformanceMeeting } from "./HumanPerformanceMeeting";
import { HumanPerformanceOverlays } from "./HumanPerformanceOverlays";
import { HumanPerformancePlaceAction } from "./HumanPerformancePlaceAction";
import { HumanPerformancePlaceCarrier } from "./HumanPerformancePlaceCarrier";
import { HumanPerformancePlaceCue } from "./HumanPerformancePlaceCue";
import { HumanPerformancePlacePerformer } from "./HumanPerformancePlacePerformer";
import { HumanPerformancePlaceProp } from "./HumanPerformancePlaceProp";
import { HumanPerformancePlaceTiming } from "./HumanPerformancePlaceTiming";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPerformanceTempo } from "./HumanPerformanceTempo";
import { HumanPreparedPlayback } from "./HumanPreparedPlayback";
import { HumanSegment } from "./HumanSegment";
import { HumanSegmentOverlay } from "./HumanSegmentOverlay";

/**
 * One intent placed in the performance: its law found, its entry state read,
 * its context built, its plan made, its cut checked against the interrupt
 * tables, and its action added to its performer.
 */
export namespace HumanPerformancePlace {
  /**
   * The schedule's timing law: plan the intent from the state its person is in.
   * A trial plans and returns the timing without placing anything, and its
   * planning is kept for the placement of the same intent at the same start
   * with nothing placed in between (`IAutoMovieMotionHumanPerformanceTrial`).
   * Participant registry/body/entry metadata is fixed for this action context,
   * so its private per-subject reader templates share closures until context
   * release. Every performer lookup still checks existence and returns a fresh
   * wrapper; every reader still observes actual
   * seconds/plans/stops/invalidation. At most the context's requested known
   * participants are retained, with no pose, frame, time-result history or
   * operation FK/projector stored there.
   */
  export function place(
    self: IAutoMovieMotionHumanPerformanceState,
    intent: IAutoMovieIntent,
    start: number,
    entries: readonly IAutoMovieScheduleEntry[],
    where: IAutoMovieMotionHumanRefusal.IWhere,
    trial: boolean = false,
  ) {
    const person: IAutoMovieMotionHumanSegment.IPerson =
      HumanPerformanceRead.person(self, intent.subject);
    const name: AutoMovieMotionHumanActionKey = intent.capability;
    const law: IAutoMovieMotionHumanActionLaw<never> | undefined =
      self.laws.get(name);
    if (law === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "act",
        value: intent.capability,
        feasible: { kind: "alternatives", values: [...self.laws.keys()] },
        reason: `no action is named ${intent.capability}`,
        fix: "name an action of the vocabulary, or register the law that performs it (the performance's laws)",
      });
    const given: object =
      (intent.parameters?.params as object | undefined) ?? {};

    const params: object = law.resolve?.(given) ?? given;

    // The parameter through which this action named an id, so a refusal of a
    // missing performer, prop or anchor points at what the author wrote.
    const named = (id: string, otherwise: string): string =>
      Object.entries(params).find(
        ([, value]: [string, unknown]): boolean => value === id,
      )?.[0] ?? otherwise;

    // An overlay rides the action that carries the body at its start; any
    // other action follows the person's last one.
    const over: boolean = intent.parameters?.over === true;
    if (over && law.overlay !== true)
      throw new HumanRefusal({
        kind: "channel",
        axis: "over",
        value: name,
        feasible: {
          kind: "alternatives",
          values: [...self.laws]
            .filter(
              ([, each]: [
                string,
                IAutoMovieMotionHumanActionLaw<never>,
              ]): boolean => each.overlay === true,
            )
            .map(
              ([key]: [
                string,
                IAutoMovieMotionHumanActionLaw<never>,
              ]): string => key,
            ),
        },
        reason: `${name} moves the whole body, so it cannot be performed over another action`,
        fix: `perform ${name} as an action of its own, or put one of the listed actions over the carrier`,
      });
    const previous: IAutoMovieMotionHumanSegment | undefined = over
      ? [...person.segments]
          .reverse()
          .find(
            (s: IAutoMovieMotionHumanSegment): boolean =>
              s.entryTime <= start + 1e-9,
          )
      : person.segments.at(-1);
    if (over && previous === undefined)
      throw new HumanRefusal({
        kind: "base",
        axis: "over",
        value: name,
        reason: `${name} is performed over an action, and ${intent.subject} performs none at ${start.toFixed(2)} s`,
        fix: "append the action that carries the body first, then put self one over it",
      });
    const before: IAutoMovieScheduleEntry | undefined = [...entries]
      .reverse()
      .find(
        (e: IAutoMovieScheduleEntry): boolean =>
          e.subject === intent.subject && !self.riding.has(e.index),
      );
    if (!over && previous !== undefined && before !== undefined)
      previous.end = self.clipped.get(before.index) ?? before.end;
    if (start < -1e-9 || (!over && start < (previous?.entryTime ?? 0) - 1e-9))
      throw new HumanRefusal({
        kind: "cut",
        axis: "sync",
        value: start,
        feasible: {
          kind: "range",
          minimum: Math.max(0, over ? 0 : (previous?.entryTime ?? 0)),
          maximum: null,
          unit: "s",
        },
        reason: `${name} would start at ${start.toFixed(2)} s, before ${
          start < -1e-9 || previous === undefined
            ? "the film begins"
            : `${previous.name} begins at ${previous.entryTime.toFixed(2)} s`
        }`,
        fix: "align it to a later instant, or give it a smaller negative offset",
      });
    const row = over
      ? undefined
      : HumanSegment.row(
          intent.subject,
          previous,
          before,
          name,
          start,
          law.accepts,
          law.family,
        );

    // The inertialization the cut into this action decays over, the
    // tolerance its entry state is read to; none for an overlay.
    const blend: number | undefined = over ? undefined : (row?.blend ?? 0.25);

    // The alignment's last trial planned this intent at this start with the
    // same placed state: its planning is the one this placement would make
    // (`IAutoMovieMotionHumanPerformanceTrial`). A placement reads or drops the kept trial.
    const last: IAutoMovieMotionHumanPerformanceTrial | undefined = trial
      ? undefined
      : self.trial;
    const kept: IAutoMovieMotionHumanPerformanceTrial | undefined =
      last !== undefined &&
      last.intent === intent &&
      last.start === start &&
      last.placements === self.placements &&
      last.entries === entries.length
        ? last
        : undefined;
    if (!trial) self.trial = undefined;

    // An overlay entering where the act before it in its chain ends reads
    // that act's end, which hands its channels on (`HumanSegmentOverlay.handing`).
    const read: () => ReturnType<typeof HumanSegment.entry> = (): ReturnType<
      typeof HumanSegment.entry
    > => HumanSegment.entry(person, previous, start, blend);
    const entry: ReturnType<typeof HumanSegment.entry> =
      kept === undefined
        ? over
          ? HumanSegmentOverlay.handing(start, read)
          : read()
        : kept.context.entry;
    const instance: number = [...person.segments, ...person.overlays].filter(
      (s: IAutoMovieMotionHumanSegment): boolean =>
        s.id === (intent.anchor ?? name),
    ).length;
    const body: IAutoMovieMotionHumanActionContext<never>["body"] =
      person.performer.body;
    // The overlays an overlay is laid on: those placed before it.
    const laid: number = person.overlays.length;

    // The performer's own bones are those of the entry pose, fixed for the
    // action: admitted once, as the action is placed, and every read takes fresh
    // bones of that one reading (`poseBones.read`).
    const entered: ReturnType<typeof poseBones.read> = poseBones.read(
      body,
      entry.pose,
    );
    const ownBones: (
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ) => ReturnType<typeof poseBones> = (
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): ReturnType<typeof poseBones> => entered.map(requested);
    // Each partner of this action's own parallel group
    // (`IAutoMovieScheduleContext.meeting`) whose part still waits is read
    // no later than the end of their placed actions, recorded as this action
    // is placed, so a plan that reads the partner lazily afterwards reads the
    // same pose the action was timed against: past it, at their last placed
    // pose held. A partner placed whole before this action (a carrier the
    // borne rides, a helper whose palm the helped grips) is read live.
    const meetings: Map<string, number> = new Map();
    for (const other of self.people.keys()) {
      if (other === intent.subject || self.meeting?.(other) === undefined)
        continue;
      const placed: readonly IAutoMovieMotionHumanSegment[] =
        HumanPerformanceRead.person(self, other).segments;
      if ((self.intended.get(other)?.length ?? 0) > placed.length)
        meetings.set(other, placed.at(-1)?.end ?? 0);
    }
    // The arm solutions this action's plans hand each other in this
    // performance: an alignment trial's, its placement's and a tempo
    // replan's read what the plan before them wrote, under one map.
    let handed:
      | IAutoMovieMotionHumanActionContext.IHandover["last"]
      | undefined = self.handovers.get(intent);
    if (handed === undefined) {
      handed = new Map();
      self.handovers.set(intent, handed);
    }
    const drafted: IAutoMovieMotionHumanActionContext<never> = {
      subject: intent.subject,
      handover: { warm: handed, last: handed },
      body,
      params: params as never,
      skill: person.skill,
      ...(person.performer.attributes === undefined
        ? {}
        : { attributes: person.performer.attributes }),
      entry,
      start,
      instant: (at: AutoMovieMotionHumanScheduledInstant): number =>
        HumanPerformanceLayers.instant(self, at, entries),
      ...(over && previous !== undefined
        ? { carrier: HumanPerformancePlaceCarrier(previous, start) }
        : {}),
      aim: (target: IAutoMovieMotionTarget, seconds: number) =>
        HumanPerformanceAim.aim(
          self,
          target,
          seconds,
          HumanPerformanceAim.frame(
            body,
            entry.posture,
            ownBones,
            intent.subject,
          ),
          meetings,
        ),
      forces: (
        from: number,
        to: number,
      ): readonly IAutoMovieMotionHumanForce[] =>
        HumanForce.within(
          self.forces,
          intent.subject,
          start + from,
          start + to,
        ),
      random: (channel: string) =>
        HumanSkill.stream(
          person.skill,
          intent.subject,
          intent.anchor ?? name,
          instance,
          channel,
        ),
      series: (
        channel: string,
      ): IAutoMovieMotionHumanActionContext.ISeries => ({
        random: HumanSkill.series(
          person.skill,
          intent.subject,
          intent.anchor ?? name,
          channel,
        ),
        index: instance,
      }),
      cue: HumanPerformancePlaceCue(self, named),
      obstacles: (): readonly IAutoMovieMotionHumanObstacle[] => self.obstacles,
      performer: HumanPerformancePlacePerformer(
        self,
        intent.subject,
        ownBones,
        meetings,
        named,
      ),
      prop: HumanPerformancePlaceProp(
        self,
        intent.subject,
        over,
        person,
        laid,
        named,
      ),
      meeting: HumanPerformanceMeeting.reader(
        self,
        intent.subject,
        body,
        entry,
        start,
      ),
      action: HumanPerformancePlaceAction(self, named),
    };
    // What the performer's next action on a prop demands of a grip this one
    // chooses (`HumanPerformanceAhead`); an overlay leaves the body's grips
    // to its carrier.
    const context: IAutoMovieMotionHumanActionContext<never> =
      kept?.context ?? drafted;
    if (!over && kept === undefined) {
      context.demands = HumanPerformanceAhead.reader(
        self,
        context,
        person.segments.length,
      );
      // How the composition cuts this action into the next one, and what
      // that one plants (`HumanPerformanceAhead.cut`).
      const cut: IAutoMovieMotionHumanActionContext.ICut | undefined =
        HumanPerformanceAhead.cut(self, intent, person.segments.length);
      if (cut !== undefined) context.cut = cut;
    }
    // A plan too fast for the speed bound is replanned slower by its own
    // refusal's factor (`HumanPerformanceTempo`).
    let plan: IAutoMovieMotionHumanActionPlan =
      kept?.plan ?? HumanPerformanceTempo.plan(law, context);
    const share: number =
      kept?.share ??
      (row === undefined ? 0 : HumanSegment.share(row.entry, plan));
    if (kept === undefined && share > 0) {
      context.start = start - share * plan.duration;
      plan = HumanPerformanceTempo.plan(law, context);
    }

    // A trial withdraws the meetings its planning recorded; the placement
    // that takes the trial's plan records them again.
    for (const [key, value] of kept?.meetings ?? [])
      self.meetings.set(key, value);

    // The timing the schedule reads: the part of the plan left after the
    // share it enters at, its contact and events on that part. A trial
    // reads the same timing the placed action gives.
    const timing: IAutoMovieIntentTiming = HumanPerformancePlaceTiming(
      plan,
      share,
    );
    const active: number = timing.duration;
    if (trial) {
      self.trial = {
        intent,
        start,
        placements: self.placements,
        entries: entries.length,
        context,
        plan,
        share,
        meetings: [],
      };
      return timing;
    }
    self.placements++;

    // An action aligned into its performer's previous one ends that one
    // where it starts, as the cut the cancel table just allowed.
    if (!over && previous !== undefined && start < previous.end - 1e-9) {
      previous.end = start;
      self.clipped.set(previous.entry, start);
      HumanPerformanceContacts.cutHolds(person, previous.entry, start);
    }

    // A law may refuse only once a posture is asked of it (a goal that turns
    // out beyond reach at some second), long after it was placed; that
    // refusal is located here, where the action's place in the film is known.
    const posture: IAutoMovieMotionHumanActionPlan["posture"] = plan.posture;
    const installed: IAutoMovieMotionHumanActionPlan["posture"] =
      prepareJumpPosture.located(posture, where);
    plan.posture = installed;
    HumanPreparedPlayback.locate(plan, posture, installed, where);
    if (over && previous !== undefined)
      return HumanPerformanceOverlays.place(
        self,
        person,
        previous,
        intent,
        entries,
        {
          name,
          params,
          law,
          context,
          plan,
          start,
        },
      );
    const segment: IAutoMovieMotionHumanSegment = {
      index: person.segments.length,
      entry: entries.length,
      id: intent.anchor ?? name,
      name,
      params,
      law,
      context,
      plan,
      start: context.start,
      entryTime: start,
      end: start + active,
      transition:
        previous === undefined
          ? undefined
          : {
              kind: row?.kind ?? "inertialize",
              blend: blend!,
              source: previous,
              cut: start,
            },
    };
    HumanPerformanceContacts.hold(person, segment, false);
    person.segments.push(segment);
    if (intent.anchor !== undefined)
      self.anchors.set(
        intent.anchor,
        Object.assign(segment, { subject: intent.subject }),
      );
    return timing;
  }
}
