import {
  type AutoMovieComposition,
  type IAutoMovieSchedule,
  checkAutoMovieLegality,
  resolveAutoMovieSchedule,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
} from "@automovie/interface";

import { HUMAN_ACTIONS } from "../actions/HUMAN_ACTIONS";
import { stand } from "../actions/stand";
import { AutoMovieMotionMeeting } from "../compose/AutoMovieMotionMeeting";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanLayer } from "../law/IHumanLayer";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import type { HumanObstacle } from "./HumanObstacle";
import type { HumanPerformance } from "./HumanPerformance";
import { HumanPerformanceAim } from "./HumanPerformanceAim";
import { HumanPerformanceContacts } from "./HumanPerformanceContacts";
import { HumanPerformanceLayers } from "./HumanPerformanceLayers";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPerformanceSchedule } from "./HumanPerformanceSchedule";
import { HumanSegment } from "./HumanSegment";
import type { IHumanPerformer } from "./IHumanPerformer";
import type { IHumanProp } from "./IHumanProp";

/**
 * Everything a performance resolves and its readers share: the people with
 * their placed actions, the props, the laws, the cue tracks and the
 * schedule, built once by the constructor.
 *
 * `HumanPerformance` is the public surface over it. The state's members are
 * public so the `HumanPerformance*` namespaces, which hold the performance's
 * work by responsibility (placing, contacts, layers, the schedule, aiming and
 * reading), can share them; nothing outside the performance reads it, and
 * the package does not export it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the record holds, who reads it, why its members are public and that it is not exported.
 * @evidence contracts/development/design.md#principled-representation One record of the resolved performance, built in one place and read by functions that take it, in place of one class of two thousand lines.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members are the ones the performance kept privately before the split (#3399); none was added.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No reader keeps a copy of a member; the caches live here and are settled here.
 */
export class HumanPerformanceState {
  /** The resolved schedule. */
  public readonly schedule: IAutoMovieSchedule;

  /** Seconds from 0 to the last action's end. */
  public readonly duration: number;

  /** The people, as the performance was given them. */
  public readonly performers: readonly IHumanPerformer[];

  /** The people with their placed actions, holds, layers and pose caches, by subject. */
  public readonly people: Map<string, HumanSegment.IPerson>;

  /** The props, by subject. */
  public readonly props: Map<string, IHumanProp>;

  /** The placed actions that carry an anchor, by the anchor, with their performer. */
  public readonly anchors: Map<
    string,
    HumanSegment.ISegment & { subject: string }
  >;

  /** The spans in which each prop is held or worn, by the prop: who holds it in which hand or wears it on which bone, from when to when and at which offset from the hand or the bone; found once the performance is placed. */
  public readonly gripCache: Map<string, HumanPerformanceState.IGrip[]> =
    new Map();

  /** The meetings of the mutual actions, by their kind, start and performers: the performer who computed each and the meeting every role reads. */
  public readonly meetings: Map<
    string,
    { subject: string; meeting: AutoMovieMotionMeeting.IMeeting }
  > = new Map();

  /** Every law the performance runs, by name: the vocabulary's and the ones it was given. */
  public readonly laws: Map<string, IHumanActionLaw<never>>;

  /** The schedule entries that are overlays, by walk-order index: they ride a carrier and never follow or precede one. */
  public readonly riding: Set<number> = new Set();

  /** What stands in the performers' way. */
  public readonly obstacles: readonly HumanObstacle.IObstacle[];

  /** The cue tracks, by name. */
  public readonly cues: Readonly<
    Record<string, readonly resolveAutoMovieSchedule.ICue[]>
  >;

  /** Where an action aligned into its performer's previous one ended that one, by the previous one's schedule entry. */
  public readonly clipped: Map<number, number> = new Map();

  /** The instants of every anchored layer, by its anchor: those known before the schedule from the start, the others once it is placed. */
  public readonly layered: Map<
    string,
    readonly resolveAutoMovieSchedule.ICue[]
  > = new Map();

  /** How many actions that carry the body the composition gives each person, overlays aside. */
  public readonly intended: Map<string, number> = new Map();

  /** Whether the schedule is still being resolved: until every action is placed, a pose may read people not placed yet, so nothing is kept. */
  public resolving: boolean = true;

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
    this.obstacles = input.obstacles ?? [];
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
            const posture: IHumanPosture = HumanPerformanceRead.posture(
              this,
              performer.subject,
              seconds,
            );
            return HumanPerformanceAim.aim(this, target, seconds, {
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
        if (this.layered.has(scheduled.anchor) || scheduled.anchor in this.cues)
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
              ? HumanPerformanceLayers.instant(this, at)
              : undefined;
        const from: number | undefined = early(scheduled.from, 0);
        const to: number | undefined = early(scheduled.to, undefined);
        this.layered.set(
          scheduled.anchor,
          from === undefined || to === undefined
            ? []
            : HumanPerformanceLayers.instants(from, to, scheduled.fade),
        );
      }
    this.schedule = HumanPerformanceSchedule.resolve(this, input);
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
      const person: HumanSegment.IPerson = HumanPerformanceRead.person(
        this,
        subject,
      );
      person.layers = layers.map(
        (layer: IHumanLayer | IHumanLayer.IScheduled): HumanSegment.ILayered =>
          "apply" in layer
            ? { layer, from: -Infinity, to: Infinity, fade: 0 }
            : HumanPerformanceLayers.window(this, person, layer),
      );
    }
    // Placement evaluated plans while later actions and people were not yet
    // placed; the contact resolution reads every plan as the whole placed
    // performance shows it. Every action is placed now, so displayed poses
    // are kept from here: the contact search reads each person's pose at the
    // same seconds once per weapon and per stop hypothesis, and `contacts`
    // forgets everyone whenever the applied stops change.
    for (const person of this.people.values()) HumanSegment.settle(person);
    HumanPerformanceContacts.contacts(this);
    for (const person of this.people.values()) HumanSegment.settle(person);
    this.resolving = false;
    for (const entry of this.schedule.entries) {
      const person: HumanSegment.IPerson = HumanPerformanceRead.person(
        this,
        entry.subject,
      );
      const segment: HumanSegment.ISegment | undefined = (
        this.riding.has(entry.index) ? person.overlays : person.segments
      ).find((s: HumanSegment.ISegment): boolean => s.entry === entry.index);
      if (segment !== undefined)
        segment.end = this.clipped.get(entry.index) ?? entry.end;
    }
    this.duration = this.schedule.duration;
  }
}
/**
 * Companion types of {@link HumanPerformanceState}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member gives its meaning.
 * @evidence contracts/development/design.md#principled-representation A held prop rides a hand and a worn one a bone; both are one span of film seconds with the offset kept from its start.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record, read by `HumanPerformanceRead.prop`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A worn span names its bone; a held span leaves it absent, so one list orders both.
 */
export namespace HumanPerformanceState {
  /** One span in which a prop is held in a hand or worn on a bone. */
  export interface IGrip {
    /** The person who holds or wears it. */
    subject: string;

    /** The holding hand; for a worn span, the side of nothing and unread. */
    side: "left" | "right";

    /** The bone it is worn on; held in the hand when absent. */
    bone?: AutoMovieHumanoidBone;

    /** The span's first film second. */
    from: number;

    /** The span's last film second. */
    to: number;

    /** The prop's frame in the hand's or the bone's frame, kept from the span's start. */
    offset?: IHumanProp.IFrame;
  }
}
