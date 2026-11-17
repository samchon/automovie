import {
  type AutoMovieComposition,
  type IAutoMovieResolvedBone,
  type IAutoMovieSchedule,
  checkAutoMovieLegality,
  type integrateAirborneRotation,
  resolveAutoMovieSchedule,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieInteractionEvent,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanLayer } from "../law/IHumanLayer";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { HumanBlast } from "./HumanBlast";
import type { HumanForce } from "./HumanForce";
import type { HumanObstacle } from "./HumanObstacle";
import { HumanPerformanceAim } from "./HumanPerformanceAim";
import { HumanPerformanceHits } from "./HumanPerformanceHits";
import { HumanPerformanceLayers } from "./HumanPerformanceLayers";
import { HumanPerformanceObject } from "./HumanPerformanceObject";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPerformanceSoft } from "./HumanPerformanceSoft";
import { HumanPerformanceState } from "./HumanPerformanceState";
import { HumanPropFlight } from "./HumanPropFlight";
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
 * An input equal to one the process resolved recently reads that resolution
 * again (`HumanPerformanceState.of`): the resolution is a pure function of
 * its input.
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

  /** Everything the performance resolved, which its readers share. */
  private readonly resolved: HumanPerformanceState;

  /**
   * Resolve a performance.
   *
   * @param input The chain seed, the performers, the props and the composition.
   * @param observation Optional native airborne-work observer. This explicit diagnostic request resolves a fresh performance instead of reading or populating the whole-performance memo; the authored input and physical admission are unchanged.
   */
  public constructor(
    input: HumanPerformance.IInput,
    observation?: ReturnType<typeof integrateAirborneRotation.observe>,
  ) {
    this.resolved = HumanPerformanceState.of(input, observation);
    this.schedule = this.resolved.schedule;
    this.duration = this.resolved.duration;
    this.performers = this.resolved.performers;
  }

  /**
   * A person's displayed canonical pose at a film second.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns The pose.
   */
  public pose(subject: string, seconds: number): IAutoMoviePose {
    return HumanPerformanceRead.pose(this.resolved, subject, seconds);
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
    return HumanPerformanceRead.posture(this.resolved, subject, seconds);
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
    return HumanPerformanceRead.bones(this.resolved, subject, seconds);
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
   * takes that hand over. A released prop stays where the last grip to end
   * released it, unless an action launched it: then it flies from the launch
   * and rests where it struck (`HumanPropFlight`) until a later grip takes it.
   *
   * @param subject The prop.
   * @param seconds Film seconds.
   * @returns Its frame.
   */
  public prop(subject: string, seconds: number): IHumanProp.IFrame {
    return HumanPerformanceRead.prop(this.resolved, subject, seconds);
  }

  /**
   * One input per coupled degree of freedom a prop's acts or tracks have
   * moved by a film second (`HumanPerformanceObject.state`), in the latest
   * begun writer's coordinate. A later writer of another coordinate of the
   * same degree replaces the old one; after its end its last travel holds.
   * A degree absent from the record starts at its leader's zero.
   *
   * @param subject The prop.
   * @param seconds Film seconds.
   * @returns Travel by articulation id, in each articulation's own unit.
   */
  public state(subject: string, seconds: number): Record<string, number> {
    const prop: IHumanProp | undefined = this.resolved.props.get(subject);
    if (prop === undefined)
      throw HumanPerformanceRead.missing("prop", subject, [
        ...this.resolved.props.keys(),
      ]);
    return HumanPerformanceObject.state(this.resolved, prop, seconds);
  }

  /**
   * A prop's flights in film order (`HumanPropFlight`): each launch an
   * action published, its engine flight and its first contact, for audits
   * and the hit record.
   *
   * @param subject The prop.
   * @returns The flights; none for a prop never launched.
   */
  public flights(subject: string): readonly HumanPropFlight.IFlight[] {
    return HumanPropFlight.flights(this.resolved, subject);
  }

  /**
   * Every hit of the performance in time order, or those on one person or
   * prop (`HumanPerformanceHits`): melee stops, blasts and flights' first
   * contacts, each as the one shared interaction record.
   *
   * @param subject The struck person or prop; every hit when absent.
   * @returns The hits.
   */
  public hits(subject?: string): readonly IAutoMovieInteractionEvent[] {
    return HumanPerformanceHits.hits(this.resolved, subject);
  }

  /**
   * A soft prop's particle positions at a film second: its lattice solved
   * once over the performance from the displayed poses at its domain's
   * fixed step, and read between the two steps around the second, so a seek
   * costs no solve and every frame rate reads the same state
   * (`HumanPerformanceSoft`).
   *
   * @param subject The soft prop.
   * @param seconds Film seconds.
   * @returns World metres, row-major `[x, y, z, ...]`.
   * @throws {HumanRefusal} When the prop is not soft or the performance outlasts its domain's step budget.
   */
  public soft(subject: string, seconds: number): number[] {
    return HumanPerformanceSoft.at(this.resolved, subject, seconds);
  }

  /**
   * The force a soft prop pulls a gripping hand with at a film second
   * (`HumanPerformanceSoft.load`): the compliant solver's force on the
   * particle the hand holds, held over its step.
   *
   * @param subject The soft prop.
   * @param person The gripping person.
   * @param side The hand.
   * @param seconds Film seconds.
   * @returns Newtons on the hand, world frame; zero when the hand does not hold the prop or its domain declares no compliance.
   */
  public softLoad(
    subject: string,
    person: string,
    side: "left" | "right",
    seconds: number,
  ): IAutoMovieVector3 {
    return HumanPerformanceSoft.load(
      this.resolved,
      subject,
      person,
      side,
      seconds,
    );
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
    return HumanPerformanceLayers.instant(this.resolved, at);
  }

  /**
   * A person's placed actions, in order.
   *
   * @param subject The person.
   * @returns The segments.
   */
  public segments(subject: string): readonly HumanSegment.ISegment[] {
    return HumanPerformanceRead.segments(this.resolved, subject);
  }

  /**
   * The actions a person performs over their placed actions, in placement
   * order: each rides a carrier and takes only its claimed channels.
   *
   * @param subject The person.
   * @returns The overlays.
   */
  public overlays(subject: string): readonly HumanSegment.IOverlay[] {
    return HumanPerformanceRead.overlays(this.resolved, subject);
  }

  /**
   * A target's world point and outward normal at a film second.
   *
   * @param target The target.
   * @param seconds Film seconds.
   * @param frame The aiming person's own frame and body, including their optional subject id so a carried or mounted prop is read on the supplied bones, as a self target is.
   * @returns The aim.
   */
  public aim(
    target: AutoMovieMotionTarget,
    seconds: number,
    frame: HumanPerformanceAim.IFrame,
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
    return HumanPerformanceAim.aim(this.resolved, target, seconds, frame);
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

    /**
     * Forces on the performers (#3429): impulses at an instant and forces
     * sustained over a span, read by the reactions the composition places
     * (`IHumanActionContext.forces`). A force starts no action. None when
     * absent.
     */
    forces?: readonly HumanForce.IForce[];

    /**
     * What stands in the performers' way: the scene's walls and solid
     * objects with their openings (`HumanObstacle`). A law that moves a body
     * across the floor reads them through its context and refuses a path
     * through a solid; none when absent, and then every path is free.
     */
    obstacles?: readonly HumanObstacle.IObstacle[];

    /**
     * Blasts in the scene: each gives a hit to every person within its
     * radius at its instant (`HumanBlast`, `hits`). None when absent.
     */
    blasts?: readonly HumanBlast.IBlast[];
  }
}
