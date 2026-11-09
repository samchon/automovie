import {
  type AutoMovieComposition,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieIntent,
  type IAutoMovieResolvedBone,
  type IAutoMovieSchedule,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
  resolveAutoMovieSchedule,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { HUMAN_ACTIONS } from "../actions/HUMAN_ACTIONS";
import { stand } from "../actions/stand";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import { HumanSegment } from "./HumanSegment";
import type { IHumanPerformer } from "./IHumanPerformer";
import type { IHumanProp } from "./IHumanProp";

/**
 * A performance of people and props: their chained actions placed on the
 * film clock, every cut checked against the actions' interrupt tables, and
 * each person's displayed pose a pure function of film seconds.
 *
 * Construction resolves the composition with the engine's schedule resolver.
 * Each intent's timing comes from its law's plan, made from the state the
 * performer is in when the intent starts: the previous action's displayed
 * pose and velocity at its cut or end, its posture and its planted feet. A cut
 * (an intent's `until`) is legal only inside a window of the cut action's
 * interrupt table for the next action; otherwise construction throws with
 * the legal windows. A `proximity` cut is found by scanning the 24 Hz grid for
 * the first frame within the distance and bisecting 20 times, about 1e-7 s,
 * deterministic on a fixed grid.
 *
 * Sampling a person at a second takes the active action's posture, resolves
 * it to a pose, adds the decaying inertialization offset of the transition
 * that entered it, re-solves every planted or gripping limb onto its goal so
 * no contact slides, and clamps to the range of motion ({@link HumanSegment}).
 * A person before their first action stands at their starting place.
 */
export class HumanPerformance {
  /** The resolved schedule. */
  public readonly schedule: IAutoMovieSchedule;

  /** Seconds from 0 to the last action's end. */
  public readonly duration: number;

  private readonly people: Map<string, HumanSegment.IPerson>;

  private readonly props: Map<string, IHumanProp>;

  /**
   * Resolve a performance.
   *
   * @param input The chain seed, the performers, the props and the composition.
   */
  public constructor(input: HumanPerformance.IInput) {
    this.props = new Map((input.props ?? []).map((p: IHumanProp): [string, IHumanProp] => [p.subject, p]));
    this.people = new Map();
    for (const performer of input.performers) {
      if (this.people.has(performer.subject)) throw new Error(`Duplicate performer ${performer.subject}`);
      const initial: IHumanPosture = stand.posture(performer.body, performer.at, performer.yaw);
      this.people.set(performer.subject, {
        performer,
        skill: HumanSkill.resolve(performer.proficiency, input.seed),
        segments: [],
        initial,
        cache: new Map(),
      });
    }
    this.schedule = resolveAutoMovieSchedule(input.composition, {
      timing: (intent: IAutoMovieIntent, context) => this.place(intent, context.start, context.entries),
      until: (intent: IAutoMovieIntent, placed: { start: number; duration: number }): number | undefined =>
        this.proximity(intent, placed),
    });
    for (const entry of this.schedule.entries) {
      const person: HumanSegment.IPerson = this.person(entry.subject);
      const segment: HumanSegment.ISegment | undefined = person.segments.find((s: HumanSegment.ISegment): boolean => s.entry === entry.index);
      if (segment !== undefined) segment.end = entry.end;
    }
    this.duration = this.schedule.duration;
  }

  /**
   * A person's displayed canonical pose at a film second.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns The pose.
   */
  public pose(subject: string, seconds: number): IAutoMoviePose {
    return HumanSegment.displayed(this.person(subject), seconds);
  }

  /**
   * A person's world bones at a film second.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns Resolved bones by rig bone.
   */
  public bones(subject: string, seconds: number): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const person: HumanSegment.IPerson = this.person(subject);
    return new Map(
      resolvePose(this.pose(subject, seconds), person.performer.body.skeleton, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME).map(
        (r: IAutoMovieResolvedBone): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
      ),
    );
  }

  /**
   * A person's placed actions, in order.
   *
   * @param subject The person.
   * @returns The segments.
   */
  public segments(subject: string): readonly HumanSegment.ISegment[] {
    return this.person(subject).segments;
  }

  /**
   * A target's world point and outward normal at a film second.
   *
   * @param target The target.
   * @param seconds Film seconds.
   * @param frame The aiming person's own frame, for `point` targets in the performer frame and `none`.
   * @returns The aim.
   */
  public aim(
    target: AutoMovieMotionTarget,
    seconds: number,
    frame: { root: IAutoMovieVector3; yaw: number; heights: Record<"low" | "middle" | "high", number>; range: number },
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
    const yaw: number = (frame.yaw * Math.PI) / 180;
    const forward: IAutoMovieVector3 = { x: Math.sin(yaw), y: 0, z: Math.cos(yaw) };
    const left: IAutoMovieVector3 = { x: Math.cos(yaw), y: 0, z: -Math.sin(yaw) };
    switch (target.kind) {
      case "person": {
        const other: HumanSegment.IPerson = this.person(target.subject);
        const placed = resolveAutoMovieHumanoidSurfaces.place(
          other.performer.body.surfaces.regions[target.region],
          this.bones(target.subject, seconds).get(other.performer.body.surfaces.regions[target.region].bone)!,
        );
        return { point: placed.point, normal: placed.normal };
      }
      case "prop": {
        const prop: IHumanProp | undefined = this.props.get(target.subject);
        const point = prop?.points[target.point];
        if (point === undefined) throw new Error(`No prop point ${target.subject}.${target.point}`);
        return point(seconds);
      }
      case "point":
        return {
          point:
            target.frame === "world"
              ? target.at
              : Vector3.add({ x: frame.root.x, y: 0, z: frame.root.z }, Vector3.add(Vector3.add(Vector3.scale(left, target.at.x), { x: 0, y: target.at.y, z: 0 }), Vector3.scale(forward, target.at.z))),
          normal: Vector3.scale(forward, -1),
        };
      case "none":
        return {
          point: Vector3.add(
            { x: frame.root.x, y: frame.heights[target.line ?? "middle"], z: frame.root.z },
            Vector3.scale(forward, target.range ?? frame.range),
          ),
          normal: Vector3.scale(forward, -1),
        };
    }
  }

  /** The schedule's timing law: plan the intent from the state its person is in. */
  private place(intent: IAutoMovieIntent, start: number, entries: readonly IAutoMovieSchedule.IEntry[]) {
    const person: HumanSegment.IPerson = this.person(intent.subject);
    const name: HumanActionName = intent.capability as HumanActionName;
    const law: IHumanActionLaw<never> | undefined = HUMAN_ACTIONS[name];
    if (law === undefined) throw new Error(`${intent.subject}: no action law is named ${intent.capability}`);
    const params: object = (intent.parameters?.params as object | undefined) ?? {};
    const previous: HumanSegment.ISegment | undefined = person.segments.at(-1);
    const before: IAutoMovieSchedule.IEntry | undefined = [...entries].reverse().find((e: IAutoMovieSchedule.IEntry): boolean => e.subject === intent.subject);
    if (previous !== undefined && before !== undefined) previous.end = before.end;
    const row = HumanSegment.row(intent.subject, previous, before, name, start);
    const entry = HumanSegment.entry(person, previous, start);
    const instance: number = person.segments.filter((s: HumanSegment.ISegment): boolean => s.id === (intent.anchor ?? name)).length;
    const body = person.performer.body;
    const range: number = 0.9 * (body.measure.thigh + body.measure.shank);
    const context: IHumanActionContext<never> = {
      subject: intent.subject,
      body,
      params: params as never,
      skill: person.skill,
      entry,
      start,
      aim: (target: AutoMovieMotionTarget, seconds: number) =>
        this.aim(target, seconds, {
          root: entry.posture.root,
          yaw: entry.posture.yaw,
          heights: {
            low: body.measure.hipHeight - 0.3 * body.measure.thigh,
            middle: body.measure.chestHeight,
            high: body.measure.headHeight - 0.5 * body.measure.headRadius,
          },
          range,
        }),
      random: (channel: string) => HumanSkill.stream(person.skill, intent.subject, intent.anchor ?? name, instance, channel),
    };
    let plan = law.plan(context);
    const share: number = row === undefined ? 0 : HumanSegment.share(row.entry, plan);
    if (share > 0) {
      context.start = start - share * plan.duration;
      plan = law.plan(context);
    }
    const active: number = (1 - share) * plan.duration;
    person.segments.push({
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
          : { kind: row?.kind ?? "inertialize", blend: row?.blend ?? 0.25, source: previous, cut: start },
    });
    return {
      duration: active,
      ...(plan.contact === undefined || plan.contact < share * plan.duration ? {} : { contact: plan.contact - share * plan.duration }),
      events: plan.events
        .filter((e): boolean => e.share >= share)
        .map((e) => ({ name: e.name, share: active === 0 ? 0 : (e.share - share) / (1 - share) })),
    };
  }

  /** The share of the latest segment's active span at which a proximity cut happens. */
  private proximity(intent: IAutoMovieIntent, placed: { start: number; duration: number }): number | undefined {
    const until = intent.until;
    if (until === undefined || !("proximity" in until)) return undefined;
    const person: HumanSegment.IPerson = this.person(intent.subject);
    const segment: HumanSegment.ISegment = person.segments.at(-1)!;
    const frame = person.performer.body.surfaces.regions[until.proximity.effector];
    const gap = (seconds: number): number => {
      const effector: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(frame, this.bones(intent.subject, seconds).get(frame.bone)!).point;
      return Vector3.length(Vector3.subtract(effector, segment.context.aim(until.proximity.target, seconds).point)) - until.proximity.distance;
    };
    const step: number = 1 / 24;
    let previous: number = placed.start;
    if (gap(previous) <= 0) return 0;
    for (let t: number = placed.start + step; t <= placed.start + placed.duration + 1e-9; t += step) {
      if (gap(t) <= 0) {
        let lo: number = previous;
        let hi: number = t;
        for (let i: number = 0; i < 20; i++) {
          const mid: number = (lo + hi) / 2;
          if (gap(mid) <= 0) hi = mid;
          else lo = mid;
        }
        return placed.duration === 0 ? 0 : (hi - placed.start) / placed.duration;
      }
      previous = t;
    }
    return undefined;
  }

  /** A person by subject, or an error naming the performers. */
  private person(subject: string): HumanSegment.IPerson {
    const person: HumanSegment.IPerson | undefined = this.people.get(subject);
    if (person === undefined) throw new Error(`No performer ${subject}; performers are ${[...this.people.keys()].join(", ")}`);
    return person;
  }
}

/**
 * Companion types of {@link HumanPerformance}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member.
 * @evidence contracts/development/design.md#principled-representation A seed text, performers, props and an engine composition.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What a chain hands the performance.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the engine composition.
 */
export namespace HumanPerformance {
  /** Construction input. */
  export interface IInput {
    /** The chain seed every draw starts from. */
    seed: string;

    /** The people. */
    performers: IHumanPerformer[];

    /** The props actions aim at. */
    props?: IHumanProp[];

    /** What everyone does. */
    composition: AutoMovieComposition;
  }
}
