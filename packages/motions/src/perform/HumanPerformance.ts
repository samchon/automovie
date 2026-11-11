import {
  type AutoMovieComposition,
  type IAutoMovieIntent,
  type IAutoMovieResolvedBone,
  type IAutoMovieSchedule,
  Quaternion,
  Vector3,
  checkAutoMovieLegality,
  resolveAutoMovieContactEvents,
  resolveAutoMovieHumanoidSurfaces,
  resolveAutoMovieSchedule,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { HUMAN_ACTIONS } from "../actions/HUMAN_ACTIONS";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionMeeting } from "../compose/AutoMovieMotionMeeting";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanLayer } from "../law/IHumanLayer";
import { HumanColliders } from "../posture/HumanColliders";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
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
 * deterministic on a fixed grid whose last sample is the action's end; a
 * distance never met leaves the action uncut. Given rules, the placed schedule is checked
 * with the engine's legality check and a violation refuses the performance.
 *
 * Sampling a person at a second takes the active action's posture, resolves
 * it to a pose, adds the decaying inertialization offset of the transition
 * that entered it, re-solves every planted or gripping limb onto its goal so
 * no contact slides, and clamps to the range of motion ({@link HumanSegment}).
 * A person before their first action stands at their starting place.
 * Additive layers (gaze, breathing) apply over every action without cutting
 * it. While the schedule is resolved, a person's poses may read people whose
 * actions are not placed yet, so nothing is cached until every action is
 * placed; then caches and transition offsets start afresh.
 */
export class HumanPerformance {
  /** The resolved schedule. */
  public readonly schedule: IAutoMovieSchedule;

  /** Seconds from 0 to the last action's end. */
  public readonly duration: number;

  private readonly people: Map<string, HumanSegment.IPerson>;

  private readonly props: Map<string, IHumanProp>;

  private readonly anchors: Map<
    string,
    HumanSegment.ISegment & { subject: string }
  >;

  private readonly gripCache: Map<
    string,
    {
      subject: string;
      side: "left" | "right";
      from: number;
      to: number;
      offset?: IHumanProp.IFrame;
    }[]
  > = new Map();

  private readonly meetings: Map<
    string,
    { subject: string; meeting: AutoMovieMotionMeeting.IMeeting }
  > = new Map();

  private resolving: boolean = true;

  /**
   * Resolve a performance.
   *
   * @param input The chain seed, the performers, the props and the composition.
   */
  public constructor(input: HumanPerformance.IInput) {
    this.props = new Map(
      (input.props ?? []).map((p: IHumanProp): [string, IHumanProp] => [
        p.subject,
        p,
      ]),
    );
    this.people = new Map();
    this.anchors = new Map();
    for (const performer of input.performers) {
      if (this.people.has(performer.subject))
        throw new Error(`Duplicate performer ${performer.subject}`);
      const initial: IHumanPosture = stand.posture(
        performer.body,
        performer.at,
        performer.yaw,
      );
      const skill: HumanSkill.ISkill = HumanSkill.resolve(
        performer.proficiency,
        input.seed,
      );
      const body = performer.body;
      this.people.set(performer.subject, {
        performer,
        skill,
        segments: [],
        initial,
        cache: new Map(),
        resolving: true,
        holds: [],
        stops: new Map(),
        layers: input.layers?.[performer.subject] ?? [],
        layer: {
          subject: performer.subject,
          body,
          skill,
          aim: (target: AutoMovieMotionTarget, seconds: number) => {
            const posture: IHumanPosture = this.posture(
              performer.subject,
              seconds,
            );
            return this.aim(target, seconds, {
              root: posture.root,
              yaw: posture.yaw,
              heights: {
                low: body.measure.hipHeight - 0.3 * body.measure.thigh,
                middle: body.measure.chestHeight,
                high: body.measure.headHeight - 0.5 * body.measure.headRadius,
              },
              range: 0.9 * (body.measure.thigh + body.measure.shank),
              body,
              bones: () => poseBones(body, resolveHumanPosture(body, posture)),
            });
          },
          random: (channel: string) =>
            HumanSkill.stream(skill, performer.subject, "layer", 0, channel),
        },
      });
    }
    this.schedule = resolveAutoMovieSchedule(input.composition, {
      timing: (intent: IAutoMovieIntent, context) =>
        this.place(intent, context.start, context.entries),
      until: (
        intent: IAutoMovieIntent,
        placed: { start: number; duration: number },
      ): number | undefined => this.proximity(intent, placed),
    });
    // A production's rules (a sport's fouls, a scene's constraints) judge the
    // placed schedule before any contact is resolved: an illegal performance is
    // refused outright, the way an undeclared cut is, instead of being shown.
    const violations: checkAutoMovieLegality.IViolation[] =
      input.rules === undefined
        ? []
        : checkAutoMovieLegality(this.schedule, input.rules);
    if (violations.length !== 0)
      throw new Error(
        `The performance breaks its rules: ${violations
          .map(
            (v: checkAutoMovieLegality.IViolation): string =>
              `${v.rule} at entry ${v.entry}: ${v.detail}`,
          )
          .join("; ")}`,
      );
    // Placement evaluated plans while later actions and people were not yet
    // placed; the contact resolution reads every plan as the whole placed
    // performance shows it. Every action is placed now, so displayed poses
    // are kept from here: the contact search reads each person's pose at the
    // same seconds once per weapon and per stop hypothesis, and `contacts`
    // forgets everyone whenever the applied stops change.
    for (const person of this.people.values()) HumanSegment.settle(person);
    this.contacts();
    for (const person of this.people.values()) HumanSegment.settle(person);
    this.resolving = false;
    for (const entry of this.schedule.entries) {
      const person: HumanSegment.IPerson = this.person(entry.subject);
      const segment: HumanSegment.ISegment | undefined = person.segments.find(
        (s: HumanSegment.ISegment): boolean => s.entry === entry.index,
      );
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
   * A person's active posture at a film second, before layers: the posture
   * the active action writes, or the standing posture before the first.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns The posture.
   */
  public posture(subject: string, seconds: number): IHumanPosture {
    const person: HumanSegment.IPerson = this.person(subject);
    let active: HumanSegment.ISegment | undefined;
    for (const s of person.segments)
      if (s.entryTime <= seconds + 1e-12) active = s;
    return active === undefined
      ? person.initial
      : active.plan.posture(
          Math.min(active.plan.duration, Math.max(0, seconds - active.start)),
        );
  }

  /**
   * A person's world bones at a film second.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns Resolved bones by rig bone.
   */
  public bones(
    subject: string,
    seconds: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const person: HumanSegment.IPerson = this.person(subject);
    return poseBones(person.performer.body, this.pose(subject, seconds));
  }

  /**
   * A prop's world frame at a film second: its rest frame until a hand grips
   * it, then carried by the gripping hand with the offset it had when the
   * grip closed, and left where the last grip released it.
   *
   * A grip is any action's contact window of kind `grip` on a hand whose
   * support is this prop. The hand's grip socket rides the hand bone, so the
   * prop is a child of the hand while held: the rigid coupling of the
   * engine's `IAutoMovieAttachment`, a bone plus an offset, with the offset
   * captured at the grip's start instead of authored. When grips overlap (a
   * handover), the one that closed last carries the prop. A hold an action
   * leaves (`IHumanActionPlan.holds`) is a grip lasting until a later action
   * takes that hand over. Released props stay where the last grip to end
   * released them; falling is the physics layer's.
   *
   * @param subject The prop.
   * @param seconds Film seconds.
   * @returns Its frame.
   */
  public prop(subject: string, seconds: number): IHumanProp.IFrame {
    const prop: IHumanProp | undefined = this.props.get(subject);
    if (prop === undefined)
      throw new Error(
        `No prop ${subject}; props are ${[...this.props.keys()].join(", ") || "none"}`,
      );
    const grips = this.grips(subject);
    // The latest grip still holding carries it; with none holding, the one released last left it.
    let active: (typeof grips)[number] | undefined;
    let released: (typeof grips)[number] | undefined;
    for (const g of grips) {
      if (g.from > seconds) continue;
      if (seconds <= g.to) active = g;
      else if (released === undefined || g.to >= released.to) released = g;
    }
    const window: (typeof grips)[number] | undefined = active ?? released;
    if (window === undefined) return prop.frame;
    const at: number = Math.min(seconds, window.to);
    // A window opening on a hand that already holds the prop (a put down
    // after a pick up) keeps that grip's offset: the hand never re-seats what
    // it holds, so no action boundary moves the prop in the hand.
    const seat = (w: (typeof grips)[number]): IHumanProp.IFrame => {
      if (w.offset !== undefined) return w.offset;
      const earlier: (typeof grips)[number] | undefined = grips.find(
        (g: (typeof grips)[number]): boolean =>
          g !== w &&
          g.subject === w.subject &&
          g.side === w.side &&
          g.from < w.from &&
          g.to >= w.from - 1e-6,
      );
      if (earlier !== undefined) return (w.offset = seat(earlier));
      const before: IHumanProp.IFrame = this.prop(subject, w.from - 1e-6);
      const hand: IHumanProp.IFrame = this.hand(w.subject, w.side, w.from);
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(hand.rotation);
      return (w.offset = {
        position: Quaternion.rotateVector(
          inverse,
          Vector3.subtract(before.position, hand.position),
        ),
        rotation: Quaternion.multiply(inverse, before.rotation),
      });
    };
    const offset: IHumanProp.IFrame = seat(window);
    const hand: IHumanProp.IFrame = this.hand(window.subject, window.side, at);
    return {
      position: Vector3.add(
        hand.position,
        Quaternion.rotateVector(hand.rotation, offset.position),
      ),
      rotation: Quaternion.normalize(
        Quaternion.multiply(hand.rotation, offset.rotation),
      ),
    };
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
   * @param frame The aiming person's own frame, for `point` targets in the performer frame and `none`, and their own body and bones, for `self`.
   * @returns The aim.
   */
  public aim(
    target: AutoMovieMotionTarget,
    seconds: number,
    frame: {
      root: IAutoMovieVector3;
      yaw: number;
      heights: Record<"low" | "middle" | "high", number>;
      range: number;
      body: IHumanBody;
      bones: () => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
    },
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
    const yaw: number = (frame.yaw * Math.PI) / 180;
    const forward: IAutoMovieVector3 = {
      x: Math.sin(yaw),
      y: 0,
      z: Math.cos(yaw),
    };
    const left: IAutoMovieVector3 = {
      x: Math.cos(yaw),
      y: 0,
      z: -Math.sin(yaw),
    };
    switch (target.kind) {
      case "person": {
        const other: HumanSegment.IPerson = this.person(target.subject);
        const placed = resolveAutoMovieHumanoidSurfaces.place(
          other.performer.body.surfaces.regions[target.region],
          this.bones(target.subject, seconds).get(
            other.performer.body.surfaces.regions[target.region].bone,
          )!,
        );
        return { point: placed.point, normal: placed.normal };
      }
      case "self": {
        const region = frame.body.surfaces.regions[target.region];
        const placed = resolveAutoMovieHumanoidSurfaces.place(
          region,
          frame.bones().get(region.bone)!,
        );
        return { point: placed.point, normal: placed.normal };
      }
      case "prop": {
        const prop: IHumanProp | undefined = this.props.get(target.subject);
        const local = prop?.points[target.point];
        if (local === undefined)
          throw new Error(`No prop point ${target.subject}.${target.point}`);
        const at: IHumanProp.IFrame = this.prop(target.subject, seconds);
        return {
          point: Vector3.add(
            at.position,
            Quaternion.rotateVector(at.rotation, local.point),
          ),
          normal: Quaternion.rotateVector(at.rotation, local.normal),
        };
      }
      case "point": {
        // A performer-frame vector in the world: x left, y up, z forward.
        const turned = (v: IAutoMovieVector3): IAutoMovieVector3 =>
          Vector3.add(
            Vector3.add(Vector3.scale(left, v.x), { x: 0, y: v.y, z: 0 }),
            Vector3.scale(forward, v.z),
          );
        return {
          point:
            target.frame === "world"
              ? target.at
              : Vector3.add(
                  { x: frame.root.x, y: 0, z: frame.root.z },
                  turned(target.at),
                ),
          normal:
            target.normal === undefined
              ? Vector3.scale(forward, -1)
              : Vector3.normalize(
                  target.frame === "world"
                    ? target.normal
                    : turned(target.normal),
                ),
        };
      }
      case "none":
        return {
          point: Vector3.add(
            {
              x: frame.root.x,
              y: frame.heights[target.line ?? "middle"],
              z: frame.root.z,
            },
            Vector3.scale(forward, target.range ?? frame.range),
          ),
          normal: Vector3.scale(forward, -1),
        };
    }
  }

  /** The schedule's timing law: plan the intent from the state its person is in. */
  private place(
    intent: IAutoMovieIntent,
    start: number,
    entries: readonly IAutoMovieSchedule.IEntry[],
  ) {
    const person: HumanSegment.IPerson = this.person(intent.subject);
    const name: HumanActionName = intent.capability as HumanActionName;
    const law: IHumanActionLaw<never> | undefined = HUMAN_ACTIONS[name];
    if (law === undefined)
      throw new Error(
        `${intent.subject}: no action law is named ${intent.capability}`,
      );
    const params: object =
      (intent.parameters?.params as object | undefined) ?? {};
    const previous: HumanSegment.ISegment | undefined = person.segments.at(-1);
    const before: IAutoMovieSchedule.IEntry | undefined = [...entries]
      .reverse()
      .find(
        (e: IAutoMovieSchedule.IEntry): boolean => e.subject === intent.subject,
      );
    if (previous !== undefined && before !== undefined)
      previous.end = before.end;
    const row = HumanSegment.row(intent.subject, previous, before, name, start);
    const entry = HumanSegment.entry(person, previous, start);
    const instance: number = person.segments.filter(
      (s: HumanSegment.ISegment): boolean => s.id === (intent.anchor ?? name),
    ).length;
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
          body,
          bones: () => poseBones(body, entry.pose),
        }),
      random: (channel: string) =>
        HumanSkill.stream(
          person.skill,
          intent.subject,
          intent.anchor ?? name,
          instance,
          channel,
        ),
      performer: (subject: string): IHumanActionContext.IPerformer => ({
        body: this.person(subject).performer.body,
        bones: (seconds: number) => this.bones(subject, seconds),
      }),
      prop: (subject: string): IHumanActionContext.IProp => {
        const prop: IHumanProp | undefined = this.props.get(subject);
        if (prop === undefined)
          throw new Error(
            `${intent.subject}.${name} reads prop ${subject}; props are ${[...this.props.keys()].join(", ") || "none"}`,
          );
        return {
          prop,
          frame: (seconds: number): IHumanProp.IFrame =>
            this.prop(subject, seconds),
        };
      },
      meeting: (
        kind: AutoMovieMotionMeeting.IKind,
        role: string,
        partner?: { role: string; subject: string },
      ): AutoMovieMotionMeeting.IMeeting => {
        const own: AutoMovieMotionMeeting.IRole = {
          name: role,
          subject: intent.subject,
          body,
          posture: entry.posture,
          bones: poseBones(body, entry.pose),
        };
        if (partner === undefined)
          return AutoMovieMotionMeeting.of(kind, [own], context);
        // The role planned first computes the meeting; the other reads that
        // record while it still lies ahead of its own start.
        const key: string = `${kind.name}|${(intent.subject < partner.subject ? [intent.subject, partner.subject] : [partner.subject, intent.subject]).join("|")}`;
        const kept = this.meetings.get(key);
        if (
          kept !== undefined &&
          kept.subject !== intent.subject &&
          kept.meeting.instants.relax > context.start
        )
          return kept.meeting;
        const meeting: AutoMovieMotionMeeting.IMeeting =
          AutoMovieMotionMeeting.of(
            kind,
            [
              own,
              {
                name: partner.role,
                subject: partner.subject,
                body: this.person(partner.subject).performer.body,
                posture: this.posture(partner.subject, context.start),
                bones: this.bones(partner.subject, context.start),
              },
            ],
            context,
          );
        this.meetings.set(key, { subject: intent.subject, meeting });
        return meeting;
      },
      action: (anchor: string): IHumanActionContext.IPlaced => {
        const placed = this.anchors.get(anchor);
        if (placed === undefined)
          throw new Error(
            `${intent.subject}.${name} reads the action anchored ${anchor}, which is not placed earlier; anchors placed are ${[...this.anchors.keys()].join(", ") || "none"}`,
          );
        return {
          subject: placed.subject,
          name: placed.name,
          params: placed.params,
          plan: placed.plan,
          start: placed.start,
          entryTime: placed.entryTime,
          end: placed.end,
        };
      },
    };
    let plan = law.plan(context);
    const share: number =
      row === undefined ? 0 : HumanSegment.share(row.entry, plan);
    if (share > 0) {
      context.start = start - share * plan.duration;
      plan = law.plan(context);
    }
    const active: number = (1 - share) * plan.duration;
    const segment: HumanSegment.ISegment = {
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
              blend: row?.blend ?? 0.25,
              source: previous,
              cut: start,
            },
    };
    // A held hand: a grip window on its prop takes it over; any other use of it is refused.
    for (const held of person.holds) {
      if (held.until !== Infinity) continue;
      const take = plan.contacts.find(
        (c) =>
          c.part === `${held.side}Hand` &&
          c.kind === "grip" &&
          c.support.kind === "prop" &&
          c.support.subject === held.prop,
      );
      if (take !== undefined)
        held.until = Math.max(
          held.from,
          context.start + take.from * plan.duration,
        );
      else if (HumanSegment.drives(plan, held.side))
        throw new Error(
          `${intent.subject}: ${name} needs the ${held.side} hand, which holds ${held.prop} since ${held.source.name} (${held.source.id}); put it down or hand it over first`,
        );
    }
    person.segments.push(segment);
    for (const hold of plan.holds ?? [])
      person.holds.push({
        side: hold.side,
        prop: hold.prop,
        fingers: hold.fingers ?? {},
        source: segment,
        from: context.start + hold.from * plan.duration,
        until: Infinity,
      });
    if (intent.anchor !== undefined)
      this.anchors.set(
        intent.anchor,
        Object.assign(segment, { subject: intent.subject }),
      );
    return {
      duration: active,
      ...(plan.contact === undefined || plan.contact < share * plan.duration
        ? {}
        : { contact: plan.contact - share * plan.duration }),
      events: plan.events
        .filter((e): boolean => e.share >= share)
        .map((e) => ({
          name: e.name,
          share: active === 0 ? 0 : (e.share - share) / (1 - share),
        })),
    };
  }

  /** The share of the latest segment's active span at which a proximity cut happens. */
  private proximity(
    intent: IAutoMovieIntent,
    placed: { start: number; duration: number },
  ): number | undefined {
    const until = intent.until;
    if (until === undefined || !("proximity" in until)) return undefined;
    const person: HumanSegment.IPerson = this.person(intent.subject);
    const segment: HumanSegment.ISegment = person.segments.at(-1)!;
    const frame =
      person.performer.body.surfaces.regions[until.proximity.effector];
    const gap = (seconds: number): number => {
      const effector: IAutoMovieVector3 =
        resolveAutoMovieHumanoidSurfaces.place(
          frame,
          this.bones(intent.subject, seconds).get(frame.bone)!,
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

  /**
   * Resolve every weapon's first contact at once, in time order, each later
   * weapon seeing the earlier stops as they will be shown: a plan that takes
   * its stops is handed each one as it is committed and settled, so its own
   * dwell and recoil are what later weapons meet; a plan that does not is
   * shown with that limb frozen at the stop. Weapons are live only inside
   * their window clipped to their action's span; bodies are the other
   * people's colliders, and the person a stop met is the nearest of them.
   */
  private contacts(): void {
    const weapons: resolveAutoMovieContactEvents.IWeapon[] = [];
    const owners: Map<
      string,
      {
        person: HumanSegment.IPerson;
        segment: HumanSegment.ISegment;
        id: string;
      }
    > = new Map();
    const far: IAutoMovieVector3 = { x: 1e6, y: 1e6, z: 1e6 };
    let from: number = Infinity;
    let to: number = -Infinity;
    for (const person of this.people.values())
      for (const segment of person.segments)
        for (const w of segment.plan.weapons ?? []) {
          const a: number = Math.max(w.from, segment.entryTime);
          const b: number = Math.min(w.to, segment.end);
          if (!(b > a)) continue;
          const key: string = `${person.performer.subject}|${HumanSegment.weapon(segment, w.id)}`;
          owners.set(key, { person, segment, id: w.id });
          const tail = w.tail;
          weapons.push({
            id: key,
            owner: person.performer.subject,
            radius: w.radius,
            position: (t: number) => (t < a || t > b ? far : w.path(t)),
            ...(tail === undefined
              ? {}
              : { tail: (t: number) => (t < a || t > b ? far : tail(t)) }),
          });
          from = Math.min(from, a);
          to = Math.max(to, b);
        }
    if (weapons.length === 0) return;
    const paths: Map<
      string,
      (t: number) => [IAutoMovieVector3, IAutoMovieVector3]
    > = new Map(
      weapons.map((w) => [
        w.id,
        (t: number): [IAutoMovieVector3, IAutoMovieVector3] => {
          const p: IAutoMovieVector3 = w.position(t, new Map());
          return [p, w.tail?.(t, new Map()) ?? p];
        },
      ]),
    );
    const met: Map<string, IHumanActionPlan.IContactEvent & { key: string }> =
      new Map();
    let applied: string = "";
    const apply = (stops: resolveAutoMovieContactEvents.IStops): void => {
      const signature: string = [...stops]
        .map(([k, s]) => `${k}@${s}`)
        .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
        .join(";");
      if (signature === applied) return;
      applied = signature;
      for (const person of this.people.values()) person.stops.clear();
      const changed: Set<HumanSegment.ISegment> = new Set();
      for (const [key, seconds] of stops) {
        const owner = owners.get(key)!;
        owner.person.stops.set(
          HumanSegment.weapon(owner.segment, owner.id),
          seconds,
        );
        if (met.get(key)?.seconds !== seconds) {
          met.set(key, {
            key,
            weapon: owner.id,
            against: nearest(owner.person, paths.get(key)!(seconds), seconds),
            seconds,
          });
          changed.add(owner.segment);
        }
      }
      for (const [key, event] of [...met])
        if (!stops.has(key)) {
          met.delete(key);
          changed.add(owners.get(event.key)!.segment);
        }
      for (const segment of changed) {
        if (segment.plan.stop === undefined) continue;
        segment.plan.stop(
          [...met.values()]
            .filter((e) => owners.get(e.key)!.segment === segment)
            .map(({ weapon, against, seconds }) => ({
              weapon,
              against,
              seconds,
            })),
        );
      }

      // A stop changes what its owner shows, and whoever reads the owner (a
      // strike aimed at it, a guard watching it) planned against the earlier
      // showing, so everyone's memos go, not the owner's alone.
      for (const person of this.people.values()) HumanSegment.forget(person);
    };
    const nearest = (
      owner: HumanSegment.IPerson,
      [point, end]: [IAutoMovieVector3, IAutoMovieVector3],
      seconds: number,
    ): string => {
      let best: { subject: string; distance: number } = {
        subject: "",
        distance: Infinity,
      };
      for (const person of this.people.values()) {
        if (person === owner) continue;
        const d: number = HumanColliders.distanceToSegment(
          person.performer.body,
          this.bones(person.performer.subject, seconds),
          point,
          end,
        ).distance;
        if (d < best.distance)
          best = { subject: person.performer.subject, distance: d };
      }
      return best.subject;
    };
    const events: resolveAutoMovieContactEvents.IEvent[] =
      resolveAutoMovieContactEvents({
        weapons,
        bodies: [...this.people.values()].map(
          (person: HumanSegment.IPerson) => ({
            id: person.performer.subject,
            distance: (
              point: IAutoMovieVector3,
              seconds: number,
              stops: resolveAutoMovieContactEvents.IStops,
            ): number => {
              apply(stops);
              return HumanColliders.distance(
                person.performer.body,
                this.bones(person.performer.subject, seconds),
                point,
              ).distance;
            },
            axis: (
              a: IAutoMovieVector3,
              b: IAutoMovieVector3,
              seconds: number,
              stops: resolveAutoMovieContactEvents.IStops,
            ): number => {
              apply(stops);
              return HumanColliders.distanceToSegment(
                person.performer.body,
                this.bones(person.performer.subject, seconds),
                a,
                b,
              ).distance;
            },
          }),
        ),
        from,
        to,
        step: 1 / 120,
      });
    apply(new Map(events.map((e): [string, number] => [e.weapon, e.seconds])));
    const plans: Map<HumanSegment.ISegment, IHumanActionPlan.IContactEvent[]> =
      new Map();
    for (const owner of owners.values()) plans.set(owner.segment, []);
    for (const e of events) {
      const owner = owners.get(e.weapon)!;
      plans
        .get(owner.segment)!
        .push({ weapon: owner.id, against: e.against, seconds: e.seconds });
    }
    for (const [segment, own] of plans) segment.plan.stop?.(own);
  }

  /** Every grip window on a prop across every person, in film order, computed once after construction. */
  private grips(subject: string): {
    subject: string;
    side: "left" | "right";
    from: number;
    to: number;
    offset?: IHumanProp.IFrame;
  }[] {
    const known = this.gripCache.get(subject);
    if (known !== undefined) return known;
    const out: {
      subject: string;
      side: "left" | "right";
      from: number;
      to: number;
      offset?: IHumanProp.IFrame;
    }[] = [];
    for (const person of this.people.values()) {
      for (const held of person.holds)
        if (held.prop === subject)
          out.push({
            subject: person.performer.subject,
            side: held.side,
            from: held.from,
            to: held.until,
          });
      for (const segment of person.segments)
        for (const c of segment.plan.contacts)
          if (
            c.kind === "grip" &&
            c.support.kind === "prop" &&
            c.support.subject === subject &&
            (c.part === "leftHand" || c.part === "rightHand")
          ) {
            const from: number = Math.max(
              segment.entryTime,
              segment.start + c.from * segment.plan.duration,
            );
            const to: number = Math.min(
              segment.end,
              segment.start + c.to * segment.plan.duration,
            );
            if (to >= from)
              out.push({
                subject: person.performer.subject,
                side: c.part === "leftHand" ? "left" : "right",
                from,
                to,
              });
          }
    }
    out.sort((a, b): number => a.from - b.from);
    if (!this.resolving) this.gripCache.set(subject, out);
    return out;
  }

  /** A hand's grip-socket frame: the socket's point with the hand bone's world rotation. */
  private hand(
    subject: string,
    side: "left" | "right",
    seconds: number,
  ): IHumanProp.IFrame {
    const person: HumanSegment.IPerson = this.person(subject);
    const frame =
      person.performer.body.surfaces.sockets[
        side === "left" ? "gripLeft" : "gripRight"
      ];
    const bone: IAutoMovieResolvedBone = this.bones(subject, seconds).get(
      frame.bone,
    )!;
    return {
      position: resolveAutoMovieHumanoidSurfaces.place(frame, bone).point,
      rotation: bone.worldRotation,
    };
  }

  /** A person by subject, or an error naming the performers. */
  private person(subject: string): HumanSegment.IPerson {
    const person: HumanSegment.IPerson | undefined = this.people.get(subject);
    if (person === undefined)
      throw new Error(
        `No performer ${subject}; performers are ${[...this.people.keys()].join(", ")}`,
      );
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

    /**
     * The production's legality rules, such as `KickboxingRules.rules`,
     * checked against the placed schedule with the engine's
     * `checkAutoMovieLegality`; any violation refuses the performance with
     * every broken rule in the message. None when absent.
     */
    rules?: readonly checkAutoMovieLegality.IRule[];

    /** Additive layers per subject, applied in order over every action. */
    layers?: Readonly<Record<string, readonly IHumanLayer[]>>;
  }
}
