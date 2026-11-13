import {
  type AutoMovieComposition,
  AutoMovieScheduleError,
  type IAutoMovieIntent,
  type IAutoMovieResolvedBone,
  type IAutoMovieSchedule,
  Quaternion,
  Vector3,
  checkAutoMovieLegality,
  resolveAutoMovieContactEvents,
  resolveAutoMovieHumanoidSurfaces,
  resolveAutoMovieSchedule,
  segmentSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import { HUMAN_ACTIONS } from "../actions/HUMAN_ACTIONS";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import { AutoMovieMotionMeeting } from "../compose/AutoMovieMotionMeeting";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanLayer } from "../law/IHumanLayer";
import { HumanColliders } from "../posture/HumanColliders";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import { HumanScheduleRefusal } from "./HumanScheduleRefusal";
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

  /** The people, as the performance was given them. */
  public readonly performers: readonly IHumanPerformer[];

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

  /** Every law the performance runs, by name: the vocabulary's and the ones it was given. */
  private readonly laws: Map<string, IHumanActionLaw<never>>;

  /** The schedule entries that are overlays, by walk-order index: they ride a carrier and never follow or precede one. */
  private readonly riding: Set<number> = new Set();

  /** The cue tracks, by name. */
  private readonly cues: Readonly<
    Record<string, readonly resolveAutoMovieSchedule.ICue[]>
  >;

  /** Where an action aligned into its performer's previous one ended that one, by the previous one's schedule entry. */
  private readonly clipped: Map<number, number> = new Map();

  /** The instants of every anchored layer, by its anchor: those known before the schedule from the start, the others once it is placed. */
  private readonly layered: Map<
    string,
    readonly resolveAutoMovieSchedule.ICue[]
  > = new Map();

  /** How many actions that carry the body the composition gives each person, overlays aside. */
  private readonly intended: Map<string, number> = new Map();

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
    this.performers = [...input.performers];
    this.cues = input.cues ?? {};
    this.laws = new Map(Object.entries(HUMAN_ACTIONS));
    for (const law of input.laws ?? []) {
      // A registered name never changes what a vocabulary name means, and
      // two registered laws never share one.
      if (this.laws.has(law.name))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "laws",
          value: law.name,
          reason:
            law.name in HUMAN_ACTIONS
              ? `a registered law is named ${law.name}, which the vocabulary already performs`
              : `two registered laws are named ${law.name}`,
          fix: "register the law under a name of its own",
        });
      this.laws.set(law.name, law as IHumanActionLaw<never>);
    }
    this.people = new Map();
    this.anchors = new Map();
    for (const performer of input.performers) {
      if (this.people.has(performer.subject))
        throw new HumanRefusal({
          kind: "participant",
          performer: performer.subject,
          axis: "performers",
          value: performer.subject,
          reason: `two performers are named ${performer.subject}`,
          fix: "give every performer its own subject id",
        });
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
        overlays: [],
        initial,
        cache: new Map(),
        resolving: true,
        holds: [],
        stops: new Map(),
        // A windowed layer waits until the schedule gives its instants.
        layers: (input.layers?.[performer.subject] ?? []).flatMap(
          (
            layer: IHumanLayer | IHumanLayer.IScheduled,
          ): HumanSegment.ILayered[] =>
            "apply" in layer
              ? [{ layer, from: -Infinity, to: Infinity, fade: 0 }]
              : [],
        ),
        layer: {
          subject: performer.subject,
          body,
          skill,
          action: () => undefined,
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
    // Counted before anything is placed, so a law that reads another
    // person's path can tell a finished chain from one still to be placed.
    const count = (node: AutoMovieComposition): void => {
      if (node.kind === "at") count(node.part);
      else if (node.kind !== "intent") node.parts.forEach(count);
      else if (node.intent.parameters?.over !== true)
        this.intended.set(
          node.intent.subject,
          (this.intended.get(node.intent.subject) ?? 0) + 1,
        );
    };
    count(input.composition);

    // An anchored layer whose window waits for no action has its instants
    // before anything is placed, so actions can be synced to them: they are
    // given to the resolver as one more cue track.
    for (const [subject, layers] of Object.entries(input.layers ?? {}))
      for (const scheduled of layers) {
        if ("apply" in scheduled || scheduled.anchor === undefined) continue;
        if (
          this.layered.has(scheduled.anchor) ||
          scheduled.anchor in this.cues
        )
          throw new HumanRefusal({
            kind: "parameter",
            performer: subject,
            axis: "layers",
            value: scheduled.anchor,
            reason: `the layer anchor ${scheduled.anchor} is already the name of another layer or of a cue track (in use: ${[...this.layered.keys(), ...Object.keys(this.cues)].join(", ")})`,
            fix: "give every anchored layer a name of its own, different from every cue track's",
          });
        const early = (
          at: IHumanLayer.Instant | undefined,
          absent: number | undefined,
        ): number | undefined =>
          at === undefined
            ? absent
            : typeof at === "number" || at.of in this.cues
              ? this.instant(at)
              : undefined;
        const from: number | undefined = early(scheduled.from, 0);
        const to: number | undefined = early(scheduled.to, undefined);
        this.layered.set(
          scheduled.anchor,
          from === undefined || to === undefined
            ? []
            : HumanPerformance.instants(from, to, scheduled.fade),
        );
      }
    this.schedule = this.resolve(input);
    // A production's rules (a sport's fouls, a scene's constraints) judge the
    // placed schedule before any contact is resolved: an illegal performance is
    // refused outright, the way an undeclared cut is, instead of being shown.
    const violations: checkAutoMovieLegality.IViolation[] =
      input.rules === undefined
        ? []
        : checkAutoMovieLegality(this.schedule, input.rules);
    if (violations.length !== 0)
      throw new HumanRefusal({
        kind: "rule",
        axis: "rules",
        value: violations.map(
          (v: checkAutoMovieLegality.IViolation): string => v.rule,
        ),
        reason: `the performance breaks its rules: ${violations
          .map(
            (v: checkAutoMovieLegality.IViolation): string =>
              `${v.rule} at entry ${v.entry}: ${v.detail}`,
          )
          .join("; ")}`,
        fix: "change the entries named so that each rule holds, or leave the rule out of the performance",
      });
    // The schedule gives every instant, so the windowed layers take their
    // places among the others, in the order given.
    for (const [subject, layers] of Object.entries(input.layers ?? {})) {
      const person: HumanSegment.IPerson = this.person(subject);
      person.layers = layers.map(
        (layer: IHumanLayer | IHumanLayer.IScheduled): HumanSegment.ILayered =>
          "apply" in layer
            ? { layer, from: -Infinity, to: Infinity, fade: 0 }
            : this.window(person, layer),
      );
    }
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
      const segment: HumanSegment.ISegment | undefined = (
        this.riding.has(entry.index) ? person.overlays : person.segments
      ).find((s: HumanSegment.ISegment): boolean => s.entry === entry.index);
      if (segment !== undefined)
        segment.end = this.clipped.get(entry.index) ?? entry.end;
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
      throw this.missing("prop", subject, [...this.props.keys()]);
    if (prop.motion !== undefined) return prop.motion(seconds);
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
   * The film second of an instant: a second as given, or a named instant of
   * an anchored action or of a cue track.
   *
   * @param at The instant.
   * @returns The film second.
   * @throws {HumanRefusal} When nothing is anchored or tracked under the name, or it has no such event.
   */
  public instant(at: IHumanLayer.Instant): number {
    if (typeof at === "number") return at;
    const placed = this.anchors.get(at.of);
    // A layer's instants are known once its window is placed; a layer later
    // in a person's list, or one that waits for an action, is not placed
    // yet when an earlier window asks for it.
    const waiting: readonly resolveAutoMovieSchedule.ICue[] | undefined =
      this.layered.get(at.of);
    const track: readonly resolveAutoMovieSchedule.ICue[] | undefined =
      this.cues[at.of] ??
      (waiting === undefined || waiting.length === 0 ? undefined : waiting);
    if (placed === undefined && track === undefined)
      throw new HumanRefusal({
        kind: "participant",
        axis: "of",
        value: at.of,
        feasible: {
          kind: "alternatives",
          values: [
            ...this.anchors.keys(),
            ...Object.keys(this.cues),
            ...[...this.layered]
              .filter(
                ([, cues]: [
                  string,
                  readonly resolveAutoMovieSchedule.ICue[],
                ]): boolean => cues.length !== 0,
              )
              .map(
                ([name]: [
                  string,
                  readonly resolveAutoMovieSchedule.ICue[],
                ]): string => name,
              ),
          ],
        },
        reason:
          waiting === undefined
            ? `nothing is anchored ${at.of}, and no cue track or layer has that name`
            : `the layer anchored ${at.of} is not placed yet: its window waits for an action, or it comes later in its person's layers`,
        fix:
          waiting === undefined
            ? "name an action's anchor, a cue track or an anchored layer"
            : "name a layer given earlier in the list, or give that layer a window of film seconds and cue instants",
      });
    const entry: IAutoMovieSchedule.IEntry | undefined =
      placed === undefined
        ? undefined
        : this.schedule.entries.find(
            (e: IAutoMovieSchedule.IEntry): boolean => e.index === placed.entry,
          );
    if (placed !== undefined && at.event === undefined)
      return (entry?.contact ?? placed.entryTime) + (at.offset ?? 0);
    const events: readonly resolveAutoMovieSchedule.ICue[] =
      placed === undefined
        ? track!
        : [
            { name: "start", seconds: placed.entryTime },
            ...placed.plan.events.map((e) => ({
              name: e.name,
              seconds: placed.start + e.share * placed.plan.duration,
            })),
            {
              name: "end",
              seconds:
                entry === undefined
                  ? placed.end
                  : (this.clipped.get(entry.index) ?? entry.end),
            },
          ];
    const found: resolveAutoMovieSchedule.ICue | undefined = events.filter(
      (e: resolveAutoMovieSchedule.ICue): boolean => e.name === at.event,
    )[at.index ?? 0];
    if (found === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "event",
        value:
          at.index === undefined ? at.event : `${at.event} (index ${at.index})`,
        feasible: {
          kind: "alternatives",
          values: [
            ...new Set(
              events.map((e: resolveAutoMovieSchedule.ICue): string => e.name),
            ),
          ],
        },
        reason: `${at.of} has no such instant`,
        fix: "name one of its events, or a lower index of a repeated one",
      });
    return found.seconds + (at.offset ?? 0);
  }

  /**
   * A layer window's own named instants: it starts coming in at `onset`, is
   * fully in at `full`, starts going out at `offset` and is gone at `end`.
   * The fade is the one the window is displayed with: the one asked, 0.3 s
   * when none is, and never more than half the window.
   */
  private static instants(
    from: number,
    to: number,
    fade: number | undefined,
  ): resolveAutoMovieSchedule.ICue[] {
    const ramp: number = Math.max(0, Math.min(fade ?? 0.3, (to - from) / 2));
    return [
      { name: "onset", seconds: from },
      { name: "full", seconds: from + ramp },
      { name: "offset", seconds: to - ramp },
      { name: "end", seconds: to },
    ];
  }

  /** A scheduled layer's window in film seconds, refused where one of the person's actions holds a channel it writes. */
  private window(
    person: HumanSegment.IPerson,
    scheduled: IHumanLayer.IScheduled,
  ): HumanSegment.ILayered {
    const from: number =
      scheduled.from === undefined ? 0 : this.instant(scheduled.from);
    const to: number =
      scheduled.to === undefined
        ? this.schedule.duration
        : this.instant(scheduled.to);
    const layer: IHumanLayer =
      typeof scheduled.layer === "function"
        ? scheduled.layer({ from, to })
        : scheduled.layer;
    const located = (refusal: HumanRefusal.IProps): HumanRefusal =>
      new HumanRefusal({ performer: person.performer.subject, ...refusal });
    if (!(to > from))
      throw located({
        kind: "parameter",
        axis: "layers",
        value: layer.name,
        reason: `the layer ${layer.name} would run from ${from.toFixed(2)} s to ${to.toFixed(2)} s`,
        fix: "end the layer after it starts",
      });
    const fade: number = Math.min(scheduled.fade ?? 0.3, (to - from) / 2);
    for (const segment of person.segments) {
      const D: number = segment.plan.duration;
      for (const contact of segment.plan.contacts) {
        const held: AutoMovieMotionHumanChannel[] =
          contact.part === "leftHand" || contact.part === "rightHand"
            ? contact.part === "leftHand"
              ? ["leftHand", "leftArm"]
              : ["rightHand", "rightArm"]
            : contact.part === "leftFoot"
              ? ["leftLeg"]
              : contact.part === "rightFoot"
                ? ["rightLeg"]
                : [];
        const taken: AutoMovieMotionHumanChannel[] = held.filter(
          (c: AutoMovieMotionHumanChannel): boolean =>
            layer.channels?.includes(c) === true,
        );
        const since: number = Math.max(
          from,
          segment.entryTime,
          segment.start + contact.from * D,
        );
        const until: number = Math.min(
          to,
          segment.end,
          segment.start + contact.to * D,
        );
        if (taken.length !== 0 && until > since + 1e-9)
          throw located({
            kind: "channel",
            axis: "layers",
            value: layer.name,
            reason: `the layer ${layer.name} writes ${taken.join(", ")}, which ${segment.name} holds by a ${contact.kind} of the ${contact.part} from ${since.toFixed(2)} s to ${until.toFixed(2)} s`,
            fix: "end the layer before that contact or start it after, or use a layer that leaves that limb alone",
          });
      }
    }
    if (scheduled.anchor !== undefined) {
      if (this.anchors.has(scheduled.anchor))
        throw located({
          kind: "parameter",
          axis: "layers",
          value: scheduled.anchor,
          reason: `the layer anchor ${scheduled.anchor} is also the anchor of an action, so an instant of that name would be ambiguous`,
          fix: "give the layer a name no action is anchored under",
        });
      this.layered.set(
        scheduled.anchor,
        HumanPerformance.instants(from, to, scheduled.fade),
      );
    }
    return { layer, from, to, fade };
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
   * The actions a person performs over their placed actions, in placement
   * order: each rides a carrier and takes only its claimed channels.
   *
   * @param subject The person.
   * @returns The overlays.
   */
  public overlays(subject: string): readonly HumanSegment.IOverlay[] {
    return this.person(subject).overlays;
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
        if (prop === undefined)
          throw this.missing("prop", target.subject, [...this.props.keys()]);
        if (local === undefined)
          throw new HumanRefusal({
            kind: "affordance",
            axis: "target",
            value: `${target.subject}.${target.point}`,
            feasible: {
              kind: "alternatives",
              values: Object.keys(prop.points),
            },
            reason: `prop ${target.subject} has no point named ${target.point}`,
            fix: `aim at a point the prop declares, or declare ${target.point} in the prop's points`,
          });
        // A part that moves within the prop is where the prop says it is.
        const moving:
          | { point: IAutoMovieVector3; normal: IAutoMovieVector3 }
          | undefined = prop.point?.(target.point, seconds);
        if (moving !== undefined) return moving;
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

  /**
   * Place the composition with the engine's resolver, every action planned
   * by its law. What the resolver cannot place (an anchor or an event the
   * composition names and does not have, an anchor used twice) reaches the
   * author as a located refusal with the names that exist.
   */
  private resolve(input: HumanPerformance.IInput): IAutoMovieSchedule {
    try {
      return resolveAutoMovieSchedule(input.composition, {
        timing: (
          intent: IAutoMovieIntent,
          context: resolveAutoMovieSchedule.IContext,
        ): resolveAutoMovieSchedule.ITiming => {
          const where: HumanRefusal.IWhere = this.where(intent);
          try {
            return this.place(intent, context.start, context.entries, where);
          } catch (error) {
            throw error instanceof HumanRefusal ? error.locate(where) : error;
          }
        },
        until: (
          intent: IAutoMovieIntent,
          placed: { start: number; duration: number },
        ): number | undefined => this.proximity(intent, placed),
        cues: {
          ...this.cues,
          ...Object.fromEntries(
            [...this.layered].filter(
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
          const where: HumanRefusal.IWhere = this.where(intent);
          try {
            return this.align(intent, instant, target, context, where);
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
              this.where({ subject, capability }).instance,
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
  private align(
    intent: IAutoMovieIntent,
    instant: string,
    target: number,
    context: resolveAutoMovieSchedule.IAlignment,
    where: HumanRefusal.IWhere,
  ): number {
    const entries: readonly IAutoMovieSchedule.IEntry[] = context.entries;
    const person: HumanSegment.IPerson = this.person(intent.subject);
    const previous: HumanSegment.ISegment | undefined =
      intent.parameters?.over === true ? undefined : person.segments.at(-1);
    const floor: number = Math.max(0, previous?.entryTime ?? 0);
    let start: number = target;
    let lead: number = 0;
    for (let round: number = 0; round < 3; ++round) {
      // Planning a mutual action records its meeting; a trial must not.
      const meetings = [...this.meetings];
      const timing = this.place(
        intent,
        Math.max(floor, start),
        entries,
        where,
        true,
      );
      this.meetings.clear();
      for (const [key, value] of meetings) this.meetings.set(key, value);
      const share: number | undefined =
        timing.events.find((e): boolean => e.name === instant)?.share ??
        (instant === "start" ? 0 : instant === "end" ? 1 : undefined);
      if (share === undefined)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "sync",
          value: instant,
          feasible: {
            kind: "alternatives",
            values: ["start", ...timing.events.map((e) => e.name), "end"],
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

  /**
   * The schedule's timing law: plan the intent from the state its person is
   * in. A trial plans and returns the timing without placing anything.
   */
  private place(
    intent: IAutoMovieIntent,
    start: number,
    entries: readonly IAutoMovieSchedule.IEntry[],
    where: HumanRefusal.IWhere,
    trial: boolean = false,
  ) {
    const person: HumanSegment.IPerson = this.person(intent.subject);
    const name: HumanActionKey = intent.capability;
    const law: IHumanActionLaw<never> | undefined = this.laws.get(name);
    if (law === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "act",
        value: intent.capability,
        feasible: { kind: "alternatives", values: [...this.laws.keys()] },
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
          values: [...this.laws]
            .filter(
              ([, each]: [string, IHumanActionLaw<never>]): boolean =>
                each.overlay === true,
            )
            .map(([key]: [string, IHumanActionLaw<never>]): string => key),
        },
        reason: `${name} moves the whole body, so it cannot be performed over another action`,
        fix: `perform ${name} as an action of its own, or put one of the listed actions over the carrier`,
      });
    const previous: HumanSegment.ISegment | undefined = over
      ? [...person.segments]
          .reverse()
          .find(
            (s: HumanSegment.ISegment): boolean => s.entryTime <= start + 1e-9,
          )
      : person.segments.at(-1);
    if (over && previous === undefined)
      throw new HumanRefusal({
        kind: "base",
        axis: "over",
        value: name,
        reason: `${name} is performed over an action, and ${intent.subject} performs none at ${start.toFixed(2)} s`,
        fix: "append the action that carries the body first, then put this one over it",
      });
    const before: IAutoMovieSchedule.IEntry | undefined = [...entries]
      .reverse()
      .find(
        (e: IAutoMovieSchedule.IEntry): boolean =>
          e.subject === intent.subject && !this.riding.has(e.index),
      );
    if (!over && previous !== undefined && before !== undefined)
      previous.end = this.clipped.get(before.index) ?? before.end;
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
    const entry = HumanSegment.entry(person, previous, start);
    const instance: number = [...person.segments, ...person.overlays].filter(
      (s: HumanSegment.ISegment): boolean => s.id === (intent.anchor ?? name),
    ).length;
    const body = person.performer.body;
    const range: number = 0.9 * (body.measure.thigh + body.measure.shank);
    const carried: Map<number, IHumanPosture> = new Map();
    const context: IHumanActionContext<never> = {
      subject: intent.subject,
      body,
      params: params as never,
      skill: person.skill,
      entry,
      start,
      ...(over && previous !== undefined
        ? {
            carrier: {
              name: previous.name,
              posture: (seconds: number): IHumanPosture => {
                // The overlay's primitives and the display each ask for the
                // carrier at the same few instants, and a gait's posture is
                // costly, so the latest ones are kept.
                const at: number = Math.min(
                  previous.plan.duration,
                  Math.max(0, start + seconds - previous.start),
                );
                let posture: IHumanPosture | undefined = carried.get(at);
                if (posture === undefined) {
                  posture = previous.plan.posture(at);
                  if (carried.size >= 64)
                    carried.delete(carried.keys().next().value!);
                  carried.set(at, posture);
                }
                return posture;
              },
            },
          }
        : {}),
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
      series: (channel: string): IHumanActionContext.ISeries => ({
        random: HumanSkill.series(
          person.skill,
          intent.subject,
          intent.anchor ?? name,
          channel,
        ),
        index: instance,
      }),
      cue: (track: string): readonly resolveAutoMovieSchedule.ICue[] => {
        const cues: readonly resolveAutoMovieSchedule.ICue[] | undefined =
          this.cues[track];
        if (cues === undefined)
          throw new HumanRefusal({
            kind: "participant",
            axis: named(track, "cue"),
            value: track,
            feasible: {
              kind: "alternatives",
              values: Object.keys(this.cues),
            },
            reason: `the performance has no cue track named ${track}`,
            fix: "name one of the performance's cue tracks, or give the performance that track in its cues",
          });
        return cues;
      },
      performer: (subject: string): IHumanActionContext.IPerformer => {
        if (!this.people.has(subject))
          throw this.missing(
            "performer",
            subject,
            [...this.people.keys()],
            named(subject, "performer"),
          );
        return {
          body: this.person(subject).performer.body,
          bones: (seconds: number) => this.bones(subject, seconds),
          root: (seconds: number): IHumanActionContext.IRoot =>
            this.root(subject, seconds, named(subject, "performer")),
        };
      },
      prop: (subject: string): IHumanActionContext.IProp => {
        const prop: IHumanProp | undefined = this.props.get(subject);
        if (prop === undefined)
          throw this.missing(
            "prop",
            subject,
            [...this.props.keys()],
            named(subject, "prop"),
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
        partner?:
          | IHumanActionContext.IPartner
          | readonly IHumanActionContext.IPartner[],
      ): AutoMovieMotionMeeting.IMeeting => {
        const own: AutoMovieMotionMeeting.IRole = {
          name: role,
          subject: intent.subject,
          body,
          posture: entry.posture,
          bones: poseBones(body, entry.pose),
        };
        const others: readonly IHumanActionContext.IPartner[] =
          partner === undefined
            ? []
            : "subject" in partner
              ? [partner]
              : partner;
        if (others.length === 0)
          return AutoMovieMotionMeeting.of(kind, [own], context);

        // The role planned first computes the meeting; every other reads
        // that record while it still lies ahead of its own start. The key
        // names the whole cast in one order, so each role finds it.
        const key: string = `${kind.name}|${[
          intent.subject,
          ...others.map(
            (other: IHumanActionContext.IPartner): string => other.subject,
          ),
        ]
          .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
          .join("|")}`;
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
              ...others.map(
                (
                  other: IHumanActionContext.IPartner,
                ): AutoMovieMotionMeeting.IRole => ({
                  name: other.role,
                  subject: other.subject,
                  body: this.person(other.subject).performer.body,
                  posture: this.posture(other.subject, context.start),
                  bones: this.bones(other.subject, context.start),
                }),
              ),
            ],
            context,
          );
        this.meetings.set(key, { subject: intent.subject, meeting });
        return meeting;
      },
      action: (anchor: string): IHumanActionContext.IPlaced => {
        const placed = this.anchors.get(anchor);
        if (placed === undefined)
          throw new HumanRefusal({
            kind: "participant",
            axis: named(anchor, "anchor"),
            value: anchor,
            feasible: {
              kind: "alternatives",
              values: [...this.anchors.keys()],
            },
            reason: `the action anchored ${anchor} is not placed earlier in the composition`,
            fix: `give the answered action the anchor ${anchor} and compose it before this one`,
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
    let plan = law.plan(context);
    const share: number =
      row === undefined ? 0 : HumanSegment.share(row.entry, plan);
    if (share > 0) {
      context.start = start - share * plan.duration;
      plan = law.plan(context);
    }
    if (trial)
      return {
        duration: plan.duration,
        events: plan.events.map((e) => ({ name: e.name, share: e.share })),
      };

    // An action aligned into its performer's previous one ends that one
    // where it starts, as the cut the cancel table just allowed.
    if (!over && previous !== undefined && start < previous.end - 1e-9) {
      previous.end = start;
      this.clipped.set(previous.entry, start);
    }

    // A law may refuse only once a posture is asked of it (a goal that turns
    // out beyond reach at some second), long after it was placed; that
    // refusal is located here, where the action's place in the film is known.
    const posture: IHumanActionPlan["posture"] = plan.posture;
    plan.posture = (seconds: number): IHumanPosture => {
      try {
        return posture(seconds);
      } catch (error) {
        throw error instanceof HumanRefusal ? error.locate(where) : error;
      }
    };
    if (over && previous !== undefined) {
      // The overlay takes what its plan claims, which the carrier must yield
      // and no other overlay of the same span may hold.
      const channels: readonly AutoMovieMotionHumanChannel[] =
        plan.channels ?? [];
      const yielded: readonly AutoMovieMotionHumanChannel[] =
        previous.law.yields ?? [];
      const kept: AutoMovieMotionHumanChannel[] = channels.filter(
        (c: AutoMovieMotionHumanChannel): boolean => !yielded.includes(c),
      );
      if (kept.length !== 0)
        throw new HumanRefusal({
          kind: "channel",
          axis: "over",
          value: kept,
          feasible: { kind: "alternatives", values: [...yielded] },
          reason: `${name} claims ${channels.join(", ")}, and ${previous.name} keeps ${kept.join(", ")} for itself (it yields ${yielded.join(", ") || "nothing"})`,
          fix: `perform ${name} over an action that yields those channels, or as an action of its own`,
        });
      const end: number = start + plan.duration;
      for (const other of person.overlays) {
        if (!(other.end > start + 1e-9 && other.entryTime < end - 1e-9))
          continue;
        const shared: AutoMovieMotionHumanChannel[] = channels.filter(
          (c: AutoMovieMotionHumanChannel): boolean =>
            other.channels.includes(c),
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
      this.hold(person, overlay, true);
      this.riding.add(entries.length);
      person.overlays.push(overlay);
      if (intent.anchor !== undefined)
        this.anchors.set(
          intent.anchor,
          Object.assign(overlay, { subject: intent.subject }),
        );
      return {
        duration: plan.duration,
        ...(plan.contact === undefined ? {} : { contact: plan.contact }),
        events: plan.events.map((e) => ({ name: e.name, share: e.share })),
      };
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
    this.hold(person, segment, false);
    person.segments.push(segment);
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

  /**
   * Settle what a newly planned action does to the props its performer
   * holds, whether it carries the body or rides a carrier: a grip window on
   * a held prop takes that hand over from the hold, any other use of a
   * holding hand is refused, and the props the action leaves held become
   * holds of its own.
   */
  private hold(
    person: HumanSegment.IPerson,
    segment: HumanSegment.ISegment,
    riding: boolean,
  ): void {
    const plan: IHumanActionPlan = segment.plan;
    for (const held of person.holds) {
      if (held.until !== Infinity) continue;
      const take: IHumanActionPlan["contacts"][number] | undefined =
        plan.contacts.find(
          (c: IHumanActionPlan["contacts"][number]): boolean =>
            c.part === `${held.side}Hand` &&
            c.kind === "grip" &&
            c.support.kind === "prop" &&
            c.support.subject === held.prop,
        );
      if (take !== undefined) {
        held.until = Math.max(
          held.from,
          segment.start + take.from * plan.duration,
        );
        if (riding) held.riding = true;
      } else if (HumanSegment.drives(plan, held.side))
        throw new HumanRefusal({
          kind: "affordance",
          axis: "hand",
          value: held.side,
          feasible: {
            kind: "alternatives",
            values: person.holds.some(
              (h: HumanSegment.IHeld): boolean =>
                h.until === Infinity && h.side !== held.side,
            )
              ? []
              : [held.side === "left" ? "right" : "left"],
          },
          reason: `${segment.name} needs the ${held.side} hand, which holds ${held.prop} since ${held.source.name} (${held.source.id})`,
          fix: `put ${held.prop} down or hand it over first, or perform ${segment.name} with the free hand`,
        });
    }
    for (const hold of plan.holds ?? [])
      person.holds.push({
        side: hold.side,
        prop: hold.prop,
        fingers: hold.fingers ?? {},
        source: segment,
        from: segment.start + hold.from * plan.duration,
        until: Infinity,
      });
  }

  /** The share of the latest segment's active span at which a proximity cut happens. */
  private proximity(
    intent: IAutoMovieIntent,
    placed: { start: number; duration: number },
  ): number | undefined {
    const until = intent.until;
    if (until === undefined || !("proximity" in until)) return undefined;
    const person: HumanSegment.IPerson = this.person(intent.subject);

    // A proximity cut reads the carrier's reach; an overlay's is not found.
    if (intent.parameters?.over === true) return undefined;
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
   * A contact is mutual: when the limb a weapon meets is striking too, its
   * capsule nearest the striker stops at the same second.
   */
  private contacts(): void {
    const weapons: resolveAutoMovieContactEvents.IWeapon[] = [];
    const owners: Map<
      string,
      {
        person: HumanSegment.IPerson;
        segment: HumanSegment.ISegment;
        id: string;
        limb: IHumanActionPlan.IWeapon["limb"];
        from: number;
        to: number;
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
          owners.set(key, {
            person,
            segment,
            id: w.id,
            limb: w.limb,
            from: a,
            to: b,
          });
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

            // The limb a weapon met may be striking too. Its capsule and the
            // collider the striker measured are two measures of that one
            // limb, so the capsule nearest the striker's axis stops with it.
            carried: (
              a: IAutoMovieVector3,
              b: IAutoMovieVector3,
              seconds: number,
              stops: resolveAutoMovieContactEvents.IStops,
            ): string | undefined => {
              apply(stops);
              const bone: AutoMovieHumanoidBone =
                HumanColliders.distanceToSegment(
                  person.performer.body,
                  this.bones(person.performer.subject, seconds),
                  a,
                  b,
                ).bone;
              const part: RegExpExecArray | null =
                /^(left|right)(?:(UpperLeg|LowerLeg|Foot|Toes)|(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little))/.exec(
                  bone,
                );
              if (part === null) return undefined;
              const limb: string = `${part[1]}${part[2] === undefined ? "Arm" : "Leg"}`;
              let best: { key: string; distance: number } | undefined;
              for (const [key, owner] of owners) {
                if (
                  owner.person !== person ||
                  owner.limb !== limb ||
                  stops.has(key) ||
                  seconds < owner.from ||
                  seconds > owner.to
                )
                  continue;
                const [p, q] = paths.get(key)!(seconds);
                const distance: number = segmentSegmentDistance(a, b, p, q);
                if (best === undefined || distance < best.distance)
                  best = { key, distance };
              }
              return best?.key;
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
      for (const segment of [...person.segments, ...person.overlays])
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

  /**
   * Where a person's placed actions put their root at a film second, for a
   * law that plans from another person's path.
   *
   * While the schedule is being placed the path is known only up to the
   * person's last placed action. A second beyond it is refused when the
   * composition still holds actions of theirs to place, because the answer
   * would change once they are placed; with none left, the person stays
   * where the last action put them.
   */
  private root(
    subject: string,
    seconds: number,
    axis: string,
  ): IHumanActionContext.IRoot {
    const person: HumanSegment.IPerson = this.person(subject);
    const last: HumanSegment.ISegment | undefined = person.segments.at(-1);
    const left: number =
      (this.intended.get(subject) ?? 0) - person.segments.length;
    if (
      this.resolving &&
      left > 0 &&
      seconds > (last?.end ?? 0) + 1e-9
    )
      throw new HumanRefusal({
        kind: "participant",
        axis,
        value: subject,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: Math.floor((last?.end ?? 0) * 1000) / 1000,
          unit: "s",
        },
        reason: `where ${subject} is at ${seconds.toFixed(2)} s is not known yet: ${
          last === undefined
            ? "none of their actions is placed"
            : `their placed actions end at ${last.end.toFixed(2)} s with ${last.name}`
        }, and ${left} more of theirs come later in the composition`,
        fix: `compose ${subject}'s actions before this one: put their chain first in the parallel group, or join both chains with a mutual action`,
      });
    const posture: IHumanPosture = this.posture(subject, seconds);
    return { position: posture.root, yaw: posture.yaw };
  }

  /** A person by subject, or an error naming the performers. */
  private person(subject: string): HumanSegment.IPerson {
    const person: HumanSegment.IPerson | undefined = this.people.get(subject);
    if (person === undefined)
      throw this.missing("performer", subject, [...this.people.keys()]);
    return person;
  }

  /** The place of an intent in the film: its performer, its action and which occurrence of the action's id this is. */
  private where(intent: IAutoMovieIntent): HumanRefusal.IWhere {
    const id: string = intent.anchor ?? intent.capability;
    return {
      performer: intent.subject,
      act: intent.capability,
      instance:
        [
          ...(this.people.get(intent.subject)?.segments ?? []),
          ...(this.people.get(intent.subject)?.overlays ?? []),
        ].filter((s: HumanSegment.ISegment): boolean => s.id === id).length + 1,
    };
  }

  /** The refusal of a performer or prop the performance does not hold, listing the ones it does. */
  private missing(
    what: "performer" | "prop",
    subject: string,
    known: readonly string[],
    axis: string = what,
  ): HumanRefusal {
    return new HumanRefusal({
      kind: what === "prop" ? "affordance" : "participant",
      axis,
      value: subject,
      feasible: { kind: "alternatives", values: known },
      reason: `the performance has no ${what} named ${subject}`,
      fix: `name one of the performance's ${what}s, or add ${subject} to them`,
    });
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

    /**
     * Laws of the production's own, performed like the vocabulary's under
     * the names they carry: an act the vocabulary lacks, written on the same
     * kernel (a clock, a base and part primitives), or a row of an existing
     * law with some of its parameters fixed. A name the vocabulary already
     * has, or one given twice, refuses the performance. A registered law
     * draws from streams keyed by its own name, so registering it changes no
     * other action's draws. `HumanChain.extend` gives its typed method.
     */
    laws?: readonly IHumanActionLaw<never>[];

    /**
     * Additive layers per subject, applied in order over the person's
     * actions: each for the whole film, or scheduled in a window between two
     * instants (`IHumanLayer.IScheduled`).
     */
    layers?: Readonly<
      Record<string, readonly (IHumanLayer | IHumanLayer.IScheduled)[]>
    >;

    /**
     * Tracks of named instants that belong to no action, by track name: a
     * dialogue's line starts and accents, a score's beats (`HumanCue` builds
     * both). An action is synced to one (`HumanChain.sync`) and cut on one
     * (`until`) as on another action's events; a track's name is used like
     * an anchor, so no action may be anchored under it.
     */
    cues?: Readonly<Record<string, readonly resolveAutoMovieSchedule.ICue[]>>;
  }
}
