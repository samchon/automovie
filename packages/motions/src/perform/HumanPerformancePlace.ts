import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieIntent,
  IAutoMovieIntentTiming,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanForce,
  IAutoMovieMotionHumanObstacle,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPlacedAction,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionPropLaunch,
  IAutoMovieMotionTarget,
  IAutoMovieRigidTransform,
  IAutoMovieScheduleCue,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { HumanSkill } from "../skill/HumanSkill";
import { HumanForce } from "./HumanForce";
import { HumanPerformanceAhead } from "./HumanPerformanceAhead";
import { HumanPerformanceAim } from "./HumanPerformanceAim";
import { HumanPerformanceContacts } from "./HumanPerformanceContacts";
import { HumanPerformanceMeeting } from "./HumanPerformanceMeeting";
import { HumanPerformanceObject } from "./HumanPerformanceObject";
import { HumanPerformanceOverlays } from "./HumanPerformanceOverlays";
import { HumanPerformanceParams } from "./HumanPerformanceParams";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPerformanceTempo } from "./HumanPerformanceTempo";
import { HumanPropFlight } from "./HumanPropFlight";
import { HumanSegment } from "./HumanSegment";

/**
 * One intent placed in the performance: its law found, its entry state
 * read, its context built, its plan made, its cut checked against the
 * interrupt tables, and its action added to its performer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the steps of placing an intent.
 * @evidence contracts/development/design.md#principled-representation An intent becomes a placed action through its law's plan, made from the state the performer is in when it starts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one function the schedule resolver calls per intent (#3399).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A cut outside a declared window, an unknown action or an overlay of a whole-body action is refused.
 */
export namespace HumanPerformancePlace {
  /**
   * The schedule's timing law: plan the intent from the state its person is
   * in. A trial plans and returns the timing without placing anything.
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

    // An action's or a row's parameters are read against its schema first,
    // so a missing or a wrong value is refused at its entry.
    HumanPerformanceParams.check(name, given);
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
    const entry = HumanSegment.entry(person, previous, start, blend);
    const instance: number = [...person.segments, ...person.overlays].filter(
      (s: IAutoMovieMotionHumanSegment): boolean =>
        s.id === (intent.anchor ?? name),
    ).length;
    const body = person.performer.body;
    const carried: Map<number, IAutoMovieMotionHumanPosture> = new Map();
    const context: IAutoMovieMotionHumanActionContext<never> = {
      subject: intent.subject,
      body,
      params: params as never,
      skill: person.skill,
      ...(person.performer.attributes === undefined
        ? {}
        : { attributes: person.performer.attributes }),
      entry,
      start,
      ...(over && previous !== undefined
        ? {
            carrier: {
              name: previous.name,
              posture: (seconds: number): IAutoMovieMotionHumanPosture => {
                // The overlay's primitives and the display each ask for the
                // carrier at the same few instants, and a gait's posture is
                // costly, so the latest ones are kept.
                const at: number = Math.min(
                  previous.plan.duration,
                  Math.max(0, start + seconds - previous.start),
                );
                let posture: IAutoMovieMotionHumanPosture | undefined =
                  carried.get(at);
                if (posture === undefined) {
                  posture = previous.plan.posture(at);
                  if (carried.size >= 64)
                    carried.delete(carried.keys().next().value!);
                  carried.set(at, posture);
                }
                return posture;
              },
              // The prop the carrier plants on, the support the overlay rides.
              ...((): {
                support?: IAutoMovieMotionHumanContactWindow.Support;
              } => {
                const plant: IAutoMovieMotionHumanContactWindow | undefined =
                  previous.plan.contacts.find(
                    (c: IAutoMovieMotionHumanContactWindow): boolean =>
                      c.kind === "plant" && c.support.kind !== "ground",
                  );
                return plant === undefined ? {} : { support: plant.support };
              })(),
            },
          }
        : {}),
      aim: (target: IAutoMovieMotionTarget, seconds: number) =>
        HumanPerformanceAim.aim(
          self,
          target,
          seconds,
          HumanPerformanceAim.frame(
            body,
            entry.posture,
            () => poseBones(body, entry.pose),
            intent.subject,
          ),
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
      cue: (track: string): readonly IAutoMovieScheduleCue[] => {
        const cues: readonly IAutoMovieScheduleCue[] | undefined =
          self.cues[track];
        if (cues === undefined)
          throw new HumanRefusal({
            kind: "participant",
            axis: named(track, "cue"),
            value: track,
            feasible: {
              kind: "alternatives",
              values: Object.keys(self.cues),
            },
            reason: `the performance has no cue track named ${track}`,
            fix: "name one of the performance's cue tracks, or give the performance that track in its cues",
          });
        return cues;
      },
      obstacles: (): readonly IAutoMovieMotionHumanObstacle[] => self.obstacles,
      performer: (subject: string): IAutoMovieMotionHumanPerformerReader => {
        if (!self.people.has(subject))
          throw HumanPerformanceRead.missing(
            "performer",
            subject,
            [...self.people.keys()],
            named(subject, "performer"),
          );
        return {
          body: HumanPerformanceRead.person(self, subject).performer.body,
          // The performer's own body is read as it entered the action, as
          // a `self` target is: its displayed bones at an instant of this
          // action are the posture still being solved.
          bones: (seconds: number) =>
            subject === intent.subject
              ? poseBones(body, entry.pose)
              : HumanPerformanceRead.bones(self, subject, seconds),
          root: (seconds: number): IAutoMovieMotionHumanActionContext.IRoot =>
            HumanPerformanceRead.root(
              self,
              subject,
              seconds,
              named(subject, "performer"),
            ),
          posture: (seconds: number): IAutoMovieMotionHumanPosture => {
            // The same rule as the root's: refused beyond what is placed.
            HumanPerformanceRead.root(
              self,
              subject,
              seconds,
              named(subject, "performer"),
            );
            return HumanPerformanceRead.posture(self, subject, seconds);
          },
        };
      },
      prop: (subject: string): IAutoMovieMotionHumanPropReader => {
        const prop: IAutoMovieMotionHumanProp | undefined =
          self.props.get(subject);
        if (prop === undefined)
          throw HumanPerformanceRead.missing(
            "prop",
            subject,
            [...self.props.keys()],
            named(subject, "prop"),
          );
        return {
          prop,
          frame: (seconds: number): IAutoMovieRigidTransform =>
            HumanPerformanceRead.prop(self, subject, seconds),
          launchAt: (seconds: number): IAutoMovieMotionPropLaunch | undefined =>
            HumanPropFlight.active(self, subject, seconds)?.published,
          state: (seconds: number): Readonly<Record<string, number>> =>
            HumanPerformanceObject.state(self, prop, seconds),
        };
      },
      meeting: HumanPerformanceMeeting.reader(
        self,
        intent.subject,
        body,
        entry,
        start,
      ),
      action: (anchor: string): IAutoMovieMotionHumanPlacedAction => {
        const placed = self.anchors.get(anchor);
        if (placed === undefined)
          throw new HumanRefusal({
            kind: "participant",
            axis: named(anchor, "anchor"),
            value: anchor,
            feasible: {
              kind: "alternatives",
              values: [...self.anchors.keys()],
            },
            reason: `the action anchored ${anchor} is not placed earlier in the composition`,
            fix: `give the answered action the anchor ${anchor} and compose it before self one`,
          });
        return {
          subject: placed.subject,
          name: placed.name,
          family: placed.law.family ?? placed.name,
          params: placed.params,
          plan: placed.plan,
          start: placed.start,
          entryTime: placed.entryTime,
          end: placed.end,
        };
      },
    };
    // What the performer's next action on a prop demands of a grip this one
    // chooses (`HumanPerformanceAhead`); an overlay leaves the body's grips
    // to its carrier.
    if (!over)
      context.demands = HumanPerformanceAhead.reader(
        self,
        context,
        person.segments.length,
      );
    // A plan too fast for the speed bound is replanned slower by its own
    // refusal's factor (`HumanPerformanceTempo`).
    let plan = HumanPerformanceTempo.plan(law, context);
    const share: number =
      row === undefined ? 0 : HumanSegment.share(row.entry, plan);
    if (share > 0) {
      context.start = start - share * plan.duration;
      plan = HumanPerformanceTempo.plan(law, context);
    }

    // The timing the schedule reads: the part of the plan left after the
    // share it enters at, its contact and events on that part. A trial
    // reads the same timing the placed action gives.
    const active: number = (1 - share) * plan.duration;
    const timing: IAutoMovieIntentTiming = {
      duration: active,
      ...(plan.contact === undefined || plan.contact < share * plan.duration
        ? {}
        : { contact: plan.contact - share * plan.duration }),
      events: plan.events
        .filter((e: IAutoMovieMotionEvent): boolean => e.share >= share)
        .map(
          (e: IAutoMovieMotionEvent): IAutoMovieMotionEvent => ({
            name: e.name,
            share: active === 0 ? 0 : (e.share - share) / (1 - share),
          }),
        ),
    };
    if (trial) return timing;

    // An action aligned into its performer's previous one ends that one
    // where it starts, as the cut the cancel table just allowed.
    if (!over && previous !== undefined && start < previous.end - 1e-9) {
      previous.end = start;
      self.clipped.set(previous.entry, start);
      HumanPerformanceContacts.cutCaptures(person, previous.entry, start);
    }

    // A law may refuse only once a posture is asked of it (a goal that turns
    // out beyond reach at some second), long after it was placed; that
    // refusal is located here, where the action's place in the film is known.
    const posture: IAutoMovieMotionHumanActionPlan["posture"] = plan.posture;
    plan.posture = (seconds: number): IAutoMovieMotionHumanPosture => {
      try {
        return posture(seconds);
      } catch (error) {
        throw error instanceof HumanRefusal ? error.locate(where) : error;
      }
    };
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
