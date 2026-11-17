import {
  checkAutoMovieLegality,
  integrateAirborneRotation,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanScheduledInstant,
  IAutoMovieCheckLegality,
  IAutoMovieComposition,
  IAutoMovieIntent,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanBlast,
  IAutoMovieMotionHumanForce,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanObstacle,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPerformanceTrial,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSkill,
  IAutoMovieMotionMeeting,
  IAutoMovieMotionTarget,
  IAutoMovieSchedule,
  IAutoMovieScheduleCue,
} from "@automovie/interface";

import { HUMAN_ACTIONS } from "../actions/HUMAN_ACTIONS";
import { stand } from "../actions/stand";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import { HumanPerformanceAim } from "./HumanPerformanceAim";
import { HumanPerformanceContacts } from "./HumanPerformanceContacts";
import { HumanPerformanceFlight } from "./HumanPerformanceFlight";
import { HumanPerformanceKey } from "./HumanPerformanceKey";
import { HumanPerformanceLayers } from "./HumanPerformanceLayers";
import { HumanPerformanceObject } from "./HumanPerformanceObject";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPerformanceSchedule } from "./HumanPerformanceSchedule";
import { HumanSegment } from "./HumanSegment";

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
 * @evidence contracts/development/design.md#minimal-and-owned-surface Shared performance members retain their existing owners; flight is the single resolved staged/physical authored-turn policy read by the flight dispatcher. Supplied momentum remains physical.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No reader keeps a copy of a member; the caches live here and are settled here.
 */
export class HumanPerformanceState {
  /** The resolved schedule. */
  public readonly schedule: IAutoMovieSchedule;

  /** Seconds from 0 to the last action's end. */
  public readonly duration: number;

  /** The people, as the performance was given them. */
  public readonly performers: readonly IAutoMovieMotionHumanPerformer[];

  /** The people with their placed actions, holds, layers and pose caches, by subject. */
  public readonly people: Map<string, IAutoMovieMotionHumanSegment.IPerson>;

  /** The props, by subject. */
  public readonly props: Map<string, IAutoMovieMotionHumanProp>;

  /** The placed actions that carry an anchor, by the anchor, with their performer. */
  public readonly anchors: Map<
    string,
    IAutoMovieMotionHumanSegment & { subject: string }
  >;

  /** The spans in which each prop is held or worn, by the prop: who holds it in which hand or wears it on which bone, from when to when and at which offset from the hand or the bone; found once the performance is placed. */
  public readonly gripCache: Map<string, IAutoMovieMotionHumanPerformanceState.IGrip[]> =
    new Map();

  /** The meetings of the mutual actions, by their kind, start and performers: the performer who computed each and the meeting every role reads. */
  public readonly meetings: Map<
    string,
    { subject: string; meeting: IAutoMovieMotionMeeting }
  > = new Map();

  /** Every law the performance runs, by name: the vocabulary's and the ones it was given. */
  public readonly laws: Map<string, IAutoMovieMotionHumanActionLaw<never>>;

  /** The schedule entries that are overlays, by walk-order index: they ride a carrier and never follow or precede one. */
  public readonly riding: Set<number> = new Set();

  /** What stands in the performers' way. */
  public readonly obstacles: readonly IAutoMovieMotionHumanObstacle[];

  /** The forces on the performers (`HumanPerformance.IInput.forces`). */
  public readonly forces: readonly IAutoMovieMotionHumanForce[];

  /** Resolved authored-turn policy; explicitly supplied momentum remains physical in either mode. */
  public readonly flight: NonNullable<IAutoMovieMotionHumanPerformance.IInput["flight"]>;

  /** The cue tracks, by name. */
  public readonly cues: Readonly<
    Record<string, readonly IAutoMovieScheduleCue[]>
  >;

  /** Where an action aligned into its performer's previous one ended that one, by the previous one's schedule entry. */
  public readonly clipped: Map<number, number> = new Map();

  /** The instants of every anchored layer, by its anchor: those known before the schedule from the start, the others once it is placed. */
  public readonly layered: Map<
    string,
    readonly IAutoMovieScheduleCue[]
  > = new Map();

  /** The actions that carry the body the composition gives each person, overlays aside, in walk order: a person's placed ones are its first as many as they have placed, and the rest are still to come. */
  public readonly intended: Map<string, IAutoMovieIntent[]> = new Map();

  /** The scene's blasts (`HumanPerformance.IInput.blasts`). */
  public readonly blasts: readonly IAutoMovieMotionHumanBlast.IBlast[];

  /** The resolved first contacts of every person's striking weapons, in time order, kept for the hit record (`HumanPerformanceHits`). */
  public readonly strikes: IAutoMovieMotionHumanPerformanceState.IStrike[] = [];

  /** Whether the schedule is still being resolved: until every action is placed, a pose may read people not placed yet, so nothing is kept. */
  public resolving: boolean = true;

  /** How many actions and overlays have been placed so far: two instants with the same count have the same placed state. */
  public placements: number = 0;

  /** The plan the last alignment trial made (`HumanPerformancePlace.place` with `trial`), kept until the next placement reads or drops it; none otherwise. */
  public trial: IAutoMovieMotionHumanPerformanceTrial | undefined;

  /**
   * Resolve a performance.
   *
   * @param input The chain seed, the performers, the props and the composition.
   * @param flight The same admitted effective policy captured for this input's structural key, without rereading input.flight.
   * @param observation Optional native numeric observer forwarded only during this physical planning operation; it is never stored in the resulting state.
   */
  public constructor(
    input: IAutoMovieMotionHumanPerformance.IInput,
    flight: NonNullable<IAutoMovieMotionHumanPerformance.IInput["flight"]>,
    observation?: ReturnType<typeof integrateAirborneRotation.observe>,
  ) {
    this.flight = flight;
    this.props = new Map(
      (input.props ?? []).map((p: IAutoMovieMotionHumanProp): [string, IAutoMovieMotionHumanProp] => [
        p.subject,
        p,
      ]),
    );
    this.performers = [...input.performers];
    this.cues = input.cues ?? {};
    this.obstacles = input.obstacles ?? [];
    this.forces = input.forces ?? [];
    this.blasts = input.blasts ?? [];
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
      this.laws.set(law.name, law as IAutoMovieMotionHumanActionLaw<never>);
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
      const initial: IAutoMovieMotionHumanPosture = stand.posture(
        performer.body,
        performer.at,
        performer.yaw,
      );
      const skill: IAutoMovieMotionHumanSkill = HumanSkill.resolve(
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
            layer:
              | IAutoMovieMotionHumanLayer | IAutoMovieMotionHumanLayer.IScheduled,
          ): IAutoMovieMotionHumanSegment.ILayered[] =>
            "apply" in layer
              ? [{ layer, from: -Infinity, to: Infinity, fade: 0 }]
              : [],
        ),
        layer: {
          subject: performer.subject,
          body,
          skill,
          ...(performer.attributes === undefined
            ? {}
            : { attributes: performer.attributes }),
          action: () => undefined,
          aim: (target: IAutoMovieMotionTarget, seconds: number) => {
            const posture: IAutoMovieMotionHumanPosture = HumanPerformanceRead.posture(
              this,
              performer.subject,
              seconds,
              target.kind === "point" || target.kind === "none" ? ["root"] : undefined,
            );
            return HumanPerformanceAim.aim(
              this,
              target,
              seconds,
              HumanPerformanceAim.frame(
                body,
                posture,
                (requested?: ReadonlySet<AutoMovieHumanoidBone>): ReturnType<typeof poseBones> =>
                  poseBones(body, resolveHumanPosture.seeded(body, posture,
                    undefined, undefined, undefined, requested).pose, undefined, requested),
                performer.subject,
              ),
            );
          },
          random: (channel: string) =>
            HumanSkill.stream(skill, performer.subject, "layer", 0, channel),
        },
      });
    }
    // Listed before anything is placed, so a law that reads another
    // person's path can tell a finished chain from one still to be placed,
    // and an action can read what its performer does next.
    const list = (node: IAutoMovieComposition): void => {
      if (node.kind === "at") list(node.part);
      else if (node.kind !== "intent") node.parts.forEach(list);
      else if (node.intent.parameters?.over !== true) {
        const intents: IAutoMovieIntent[] =
          this.intended.get(node.intent.subject) ?? [];
        intents.push(node.intent);
        this.intended.set(node.intent.subject, intents);
      }
    };
    list(input.composition);

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
          at: AutoMovieMotionHumanScheduledInstant | undefined,
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
    const violations: IAutoMovieCheckLegality.IViolation[] =
      input.rules === undefined
        ? []
        : checkAutoMovieLegality(this.schedule, input.rules);
    if (violations.length !== 0)
      throw new HumanRefusal({
        kind: "rule",
        axis: "rules",
        value: violations.map(
          (v: IAutoMovieCheckLegality.IViolation): string => v.rule,
        ),
        reason: `the performance breaks its rules: ${violations
          .map(
            (v: IAutoMovieCheckLegality.IViolation): string =>
              `${v.rule} at entry ${v.entry}: ${v.detail}`,
          )
          .join("; ")}`,
        fix: "change the entries named so that each rule holds, or leave the rule out of the performance",
      });
    // The schedule gives every instant, so the windowed layers take their
    // places among the others, in the order given.
    for (const [subject, layers] of Object.entries(input.layers ?? {})) {
      const person: IAutoMovieMotionHumanSegment.IPerson = HumanPerformanceRead.person(
        this,
        subject,
      );
      person.layers = layers.map(
        (layer:
            | IAutoMovieMotionHumanLayer | IAutoMovieMotionHumanLayer.IScheduled): IAutoMovieMotionHumanSegment.ILayered =>
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

    // Authored turns use the selected staged/physical policy after contacts.
    // Given momentum remains physical. Handback changes displayed rotation,
    // so the poses read while preparing it are forgotten.
    HumanPerformanceFlight.flights(this, this.people.values(), observation);
    for (const person of this.people.values()) HumanSegment.settle(person);
    this.resolving = false;
    for (const entry of this.schedule.entries) {
      const person: IAutoMovieMotionHumanSegment.IPerson = HumanPerformanceRead.person(
        this,
        entry.subject,
      );
      const segment: IAutoMovieMotionHumanSegment | undefined = (
        this.riding.has(entry.index) ? person.overlays : person.segments
      ).find((s: IAutoMovieMotionHumanSegment): boolean => s.entry === entry.index);
      if (segment !== undefined)
        segment.end = this.clipped.get(entry.index) ?? entry.end;
    }
    // Every action ends where it is placed, so the props' drives are known.
    HumanPerformanceObject.admit(this);
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
  /**
   * How many resolved performances a process keeps, the most recently read:
   * a memory bound no act reads, sized to the most distinct inputs a consumer
   * reads between two reads of one input, plus that one. Measured at 1: over
   * nine row families of the touch and hand-to-face laws read in the test
   * program's order (68 reads of 12 inputs, every reread at most one other
   * input after its last read), and on the website, where the playground
   * asks a take's verdicts of the worker that built it right after the take
   * and a scene page's repeated takes are its own cache's.
   */
  export const KEEP: number = 2;

  /**
   * The resolved performance of an input: the one resolved before from an
   * equal input (`HumanPerformanceKey`) when the process keeps it, the input
   * resolved afresh otherwise. A resolution is a pure function of its input,
   * so an equal input reads the same plans, schedule and contacts; what its
   * readers add later is caches of the same pure functions. A refusal is not
   * kept, so it is thrown afresh each time.
   *
   * @param input The chain seed, the performers, the props and the composition.
   * @param observation An explicit native diagnostic request performs cold planning rather than observing a reused complete answer; absent, the existing memo policy is unchanged.
   * @returns The resolved performance.
   * @throws {HumanRefusal} When the input does not resolve.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States ordinary equal-input memo reuse and explicit diagnostic cold planning without retaining an observer in the result.
   * @evidence contracts/development/implementation.md#principled-implementation Pure unobserved resolution uses structural-key memoization with LRU eviction; requested physical-work observation resolves afresh. Both paths pass the key owner's single effective flight-policy capture into construction, so getters, inherited fields and non-enumerable fields cannot classify the cache and constructed state differently.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Obtain key plus admitted captured policy together; observed planning constructs with that policy, while ordinary inputs keep lookup and miss construction with the same policy. Neither constructor branch adds another input.flight access.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Diagnostics changes no authored input, physical bound or refusal. Neither cold branch rereads the flight getter after keying; an invalid captured policy refuses before serialization or lookup and cannot borrow a valid cached staged state. Keys remain content/identity values rather than mutable caller references.
   * @evidence contracts/development/implementation.md#efficient-algorithms Both paths pay the original key walk and one observer branch; an ordinary memo hit still skips resolution. Explicit observation pays full cold construction without concealing the ordinary key cost and is not a speedup path.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Equal unobserved inputs retain the existing whole-performance sharing. Observed construction still shares only its actually equivalent internal preparation, never another completed performance.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources At most KEEP ordinary resolutions remain in the memo. Observed states are neither read from nor inserted into it, and the observer is passed through construction without becoming a retained state field.
   */
  export function of(
    input: IAutoMovieMotionHumanPerformance.IInput,
    observation?: ReturnType<typeof integrateAirborneRotation.observe>,
  ): IAutoMovieMotionHumanPerformanceState {
    const selection: ReturnType<typeof HumanPerformanceKey.of> = HumanPerformanceKey.of(input);
    const key: string = selection.key;
    if (observation !== undefined) return new HumanPerformanceState(input, selection.flight, observation);
    const kept: IAutoMovieMotionHumanPerformanceState | undefined = KEPT.get(key);
    if (kept !== undefined) {
      KEPT.delete(key);
      KEPT.set(key, kept);
      return kept;
    }
    const state: IAutoMovieMotionHumanPerformanceState = new HumanPerformanceState(input, selection.flight);
    KEPT.set(key, state);
    if (KEPT.size > KEEP) KEPT.delete(KEPT.keys().next().value!);
    return state;
  }

  /** The kept resolutions by key, the least recently read first. */
  const KEPT: Map<string, IAutoMovieMotionHumanPerformanceState> = new Map();
}
