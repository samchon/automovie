import {
  checkAutoMovieLegality,
  integrateAirborneRotation,
} from "@automovie/engine";
import type {
  IAutoMovieCheckLegality,
  IAutoMovieComposition,
  IAutoMovieIntent,
  IAutoMovieInteractionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanBlast,
  IAutoMovieMotionHumanForce,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanObstacle,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerformanceSoft,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPerformanceTrial,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionMeeting,
  IAutoMovieSchedule,
  IAutoMovieScheduleContext,
  IAutoMovieScheduleCue,
} from "@automovie/interface";

import { HUMAN_ACTIONS } from "../actions/HUMAN_ACTIONS";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPerformanceBonds } from "./HumanPerformanceBonds";
import { HumanPerformanceContacts } from "./HumanPerformanceContacts";
import { HumanPerformanceFlight } from "./HumanPerformanceFlight";
import { HumanPerformanceLayers } from "./HumanPerformanceLayers";
import { HumanPerformanceObject } from "./HumanPerformanceObject";
import { HumanPerformanceOverlays } from "./HumanPerformanceOverlays";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPerformanceSchedule } from "./HumanPerformanceSchedule";
import { HumanPerformanceSoftBudget } from "./HumanPerformanceSoftBudget";
import { HumanPerformanceTether } from "./HumanPerformanceTether";
import { anchorHumanPerformanceLayers } from "./anchorHumanPerformanceLayers";
import { createHumanPerformancePerson } from "./createHumanPerformancePerson";
import { prepareHumanPerformance } from "./prepareHumanPerformance";
import { prepareHumanPerformancePlans } from "./prepareHumanPerformancePlans";
import { validateInitialPropMounts } from "./validateInitialPropMounts";

/** The alternatives of `HumanPerformanceStateLayer2`'s site. */
type HumanPerformanceStateLayer2 =
  | IAutoMovieMotionHumanLayer
  | IAutoMovieMotionHumanLayer.IScheduled;

/** The record of `IHumanPerformanceStateMeetingsEntry`'s site. */
type IHumanPerformanceStateMeetingsEntry = {
  subject: string;
  meeting: IAutoMovieMotionMeeting;
};

/** The record of `IHumanPerformanceStateAnchorsEntry`'s site. */
type IHumanPerformanceStateAnchorsEntry = { subject: string };

/**
 * Everything a performance resolves and its readers share: the people with
 * their placed actions, the props, the laws, the cue tracks and the schedule,
 * built once by the constructor.
 *
 * `HumanPerformance` is the public surface over it. The state's members are
 * public so the `HumanPerformance*` namespaces, which hold the performance's
 * work by responsibility (placing, contacts, layers, the schedule, aiming and
 * reading), can share them; nothing outside the performance reads it, and the
 * package does not export it.
 */
export class HumanPerformanceState {
  /** The resolved schedule. */
  public readonly schedule: IAutoMovieSchedule;

  /** Seconds from 0 to the last action's end. */
  public readonly duration: number;

  /** The people, as the performance was given them. */
  public readonly performers: readonly IAutoMovieMotionHumanPerformer[];

  /**
   * The people with their placed actions, holds, layers and pose caches, by
   * subject.
   */
  public readonly people: Map<string, IAutoMovieMotionHumanSegment.IPerson>;

  /** The props, by subject. */
  public readonly props: Map<string, IAutoMovieMotionHumanProp>;

  /**
   * The lines between props by the far prop each runs to, built once from the
   * props (`HumanPerformanceTether.index`).
   */
  public readonly tethered: ReadonlyMap<
    string,
    readonly IAutoMovieMotionHumanPerformanceState.ITethered[]
  >;

  /**
   * The placed actions that carry an anchor, by the anchor, with their
   * performer.
   */
  public readonly anchors: Map<
    string,
    IAutoMovieMotionHumanSegment & IHumanPerformanceStateAnchorsEntry
  >;

  /**
   * The spans in which each prop is held or worn, by the prop: who holds it in
   * which hand or wears it on which bone, from when to when and at which offset
   * from the hand or the bone; solved once when the performance is prepared.
   */
  public readonly grips: Map<
    string,
    IAutoMovieMotionHumanPerformanceState.IGrip[]
  > = new Map();

  /**
   * The meetings of the mutual actions, by their kind, start and performers:
   * the performer who computed each and the meeting every role reads.
   */
  public readonly meetings: Map<string, IHumanPerformanceStateMeetingsEntry> =
    new Map();

  /**
   * Every law the performance runs, by name: the vocabulary's and the ones it
   * was given.
   */
  public readonly laws: Map<string, IAutoMovieMotionHumanActionLaw<never>>;

  /**
   * The schedule entries that are overlays, by walk-order index: they ride a
   * carrier and never follow or precede one.
   */
  public readonly riding: Set<number> = new Set();

  /** What stands in the performers' way. */
  public readonly obstacles: readonly IAutoMovieMotionHumanObstacle[];

  /** The forces on the performers (`HumanPerformance.IInput.forces`). */
  public readonly forces: readonly IAutoMovieMotionHumanForce[];

  /**
   * Resolved authored-turn policy; explicitly supplied momentum remains
   * physical in either mode.
   */
  public readonly flight: NonNullable<
    IAutoMovieMotionHumanPerformance.IInput["flight"]
  >;

  /** The cue tracks, by name. */
  public readonly cues: Readonly<
    Record<string, readonly IAutoMovieScheduleCue[]>
  >;

  /**
   * Where an action aligned into its performer's previous one ended that one,
   * by the previous one's schedule entry.
   */
  public readonly clipped: Map<number, number> = new Map();

  /**
   * The instants of every anchored layer, by its anchor: those known before the
   * schedule from the start, the others once it is placed.
   */
  public readonly layered: Map<string, readonly IAutoMovieScheduleCue[]> =
    new Map();

  /**
   * The actions that carry the body the composition gives each person, overlays
   * aside, in walk order: a person's placed ones are its first as many as they
   * have placed, and the rest are still to come.
   */
  public readonly intended: Map<string, IAutoMovieIntent[]> = new Map();

  /** The scene's blasts (`HumanPerformance.IInput.blasts`). */
  public readonly blasts: readonly IAutoMovieMotionHumanBlast.IBlast[];

  /**
   * The resolved first contacts of every person's striking weapons, in time
   * order, kept for the hit record (`HumanPerformanceHits`).
   */
  public readonly strikes: IAutoMovieMotionHumanPerformanceState.IStrike[] = [];

  /**
   * Whether the schedule is still being resolved: until every action is placed,
   * a pose may read people not placed yet.
   */
  public resolving: boolean = true;

  /**
   * The resolver's demand placement while an action is timed
   * (`IAutoMovieMotionHumanPerformanceState.demand`).
   */
  public demand: IAutoMovieScheduleContext["demand"] = undefined;

  /**
   * The start up to which a subject holds their last placed pose while an
   * action is timed (`IAutoMovieMotionHumanPerformanceState.horizon`).
   */
  public horizon: IAutoMovieScheduleContext["horizon"] = undefined;

  /**
   * The start of a parallel group a read subject shares with the action timed
   * (`IAutoMovieMotionHumanPerformanceState.meeting`).
   */
  public meeting: IAutoMovieScheduleContext["meeting"] = undefined;

  /**
   * The placement of an anchor's waiting part while an action is timed
   * (`IAutoMovieMotionHumanPerformanceState.demandAnchor`).
   */
  public demandAnchor: IAutoMovieScheduleContext["demandAnchor"] = undefined;

  /**
   * How many actions and overlays have been placed so far: two instants with
   * the same count have the same placed state.
   */
  public placements: number = 0;

  /**
   * The plan the last alignment trial made (`HumanPerformancePlace.place` with
   * `trial`), kept until the next placement reads or drops it; none otherwise.
   */
  public trial: IAutoMovieMotionHumanPerformanceTrial | undefined;

  /**
   * The arm seeds continued by later trials of the same intent in this
   * schedule.
   */
  public readonly handovers: IAutoMovieMotionHumanPerformanceState["handovers"] =
    new Map<
      IAutoMovieIntent,
      IAutoMovieMotionHumanActionContext.IHandover["last"]
    >();

  /**
   * Each soft prop's solved lattice, by the prop, solved once when the
   * performance is prepared (`HumanPerformanceSoft`).
   */
  public readonly soft: Map<
    string,
    IAutoMovieMotionHumanPerformanceSoft.ISolved
  > = new Map();

  /**
   * Each prop's articulation writers in film order, by the prop, solved once
   * when the performance is prepared (`HumanPerformanceObject.writers`).
   */
  public readonly writers: Map<
    string,
    readonly IAutoMovieMotionHumanPerformanceState.IWriter[]
  > = new Map();

  /**
   * Each launched prop's flights, by the prop, solved once when the performance
   * is prepared (`HumanPropFlight.flights`).
   */
  public readonly flights: Map<
    string,
    readonly IAutoMovieMotionHumanPropFlight.IFlight[]
  > = new Map();

  /**
   * The flights of each prop being found, so a launch reading its prop sees the
   * flights before it.
   */
  public readonly flying: Map<
    string,
    IAutoMovieMotionHumanPropFlight.IFlight[]
  > = new Map();

  /**
   * Every hit of the placed performance in time order
   * (`HumanPerformanceHits.hits`), solved once when the performance is
   * prepared.
   */
  public hits: readonly IAutoMovieInteractionEvent[] | undefined;

  /**
   * Resolve a performance.
   *
   * @param input The chain seed, the performers, the props and the composition.
   * @param flight The same admitted effective policy captured for this input's
   *   structural key, without rereading input.flight.
   * @param observation Optional native numeric observer forwarded only during
   *   this physical planning operation; it is never stored in the resulting
   *   state.
   */
  public constructor(
    input: IAutoMovieMotionHumanPerformance.IInput,
    flight: NonNullable<IAutoMovieMotionHumanPerformance.IInput["flight"]>,
    observation?: ReturnType<typeof integrateAirborneRotation.observe>,
  ) {
    this.flight = flight;
    this.props = new Map(
      (input.props ?? []).map(
        (p: IAutoMovieMotionHumanProp): [string, IAutoMovieMotionHumanProp] => [
          p.subject,
          p,
        ],
      ),
    );
    validateInitialPropMounts(this.props);
    this.tethered = HumanPerformanceTether.index(this.props);
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
      this.people.set(
        performer.subject,
        createHumanPerformancePerson(this, performer, input),
      );
    }
    // Listed before anything is placed, so a law that reads another
    // person's path can tell a finished chain from one still to be placed,
    // and an action can read what its performer does next.
    const list = (node: IAutoMovieComposition): void => {
      if (node.type === "at") list(node.part);
      else if (node.type !== "intent") node.parts.forEach(list);
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
    anchorHumanPerformanceLayers(this, input);
    this.schedule = HumanPerformanceSchedule.resolve(this, input);
    for (const person of this.people.values())
      HumanPerformanceOverlays.validate(person);
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
      const person: IAutoMovieMotionHumanSegment.IPerson =
        HumanPerformanceRead.person(this, subject);
      person.layers = layers.map(
        (
          layer: HumanPerformanceStateLayer2,
        ): IAutoMovieMotionHumanSegment.ILayered =>
          "apply" in layer
            ? { layer, from: -Infinity, to: Infinity, fade: 0 }
            : HumanPerformanceLayers.window(this, person, layer),
      );
    }
    // A linked wear binds its wearer's limbs from where the schedule puts it.
    HumanPerformanceBonds.attach(this);

    // Placement planned while later actions and people were not yet placed;
    // the contact resolution reads every plan as the whole placed performance
    // shows it, so every plan is solved on it first, and again whenever the
    // stops the resolution installs change.
    prepareHumanPerformancePlans(this);
    HumanPerformanceContacts.contacts(this);

    // Authored turns use the selected staged/physical policy after contacts.
    // Given momentum remains physical. Handback changes displayed rotation,
    // so every plan is solved again on it.
    HumanPerformanceFlight.flights(this, this.people.values(), observation);
    prepareHumanPerformancePlans(this);
    this.handovers.clear();
    this.resolving = false;
    for (const entry of this.schedule.entries) {
      const person: IAutoMovieMotionHumanSegment.IPerson =
        HumanPerformanceRead.person(this, entry.subject);
      const segment: IAutoMovieMotionHumanSegment | undefined = (
        this.riding.has(entry.index) ? person.overlays : person.segments
      ).find(
        (s: IAutoMovieMotionHumanSegment): boolean => s.entry === entry.index,
      );
      if (segment !== undefined)
        segment.end = this.clipped.get(entry.index) ?? entry.end;
    }
    // Every action ends where it is placed, so the props' drives are known.
    HumanPerformanceObject.admit(this);
    this.duration = this.schedule.duration;
    for (const prop of this.props.values())
      if (prop.soft !== undefined)
        HumanPerformanceSoftBudget(prop.subject, prop.soft, this.duration);

    // Everything is resolved: every record a read evaluates is solved once
    // here, so every later read is a pure function of its film second.
    prepareHumanPerformance(this);
  }
}
