import { AutoMovieEngineMotionAirborneRotation } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanScheduledInstant,
  IAutoMovieInteractionEvent,
  IAutoMovieMotionHumanBallPlay,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerformanceAim,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanPropFracture,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSimulation,
  IAutoMovieMotionHumanSimulationWindow,
  IAutoMovieMotionHumanTether,
  IAutoMovieMotionTarget,
  IAutoMoviePerformanceMode,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieSchedule,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/internal/poseBones";
import { HumanBallPlay } from "../sport/internal/HumanBallPlay";
import { HumanPerformanceAim } from "./internal/HumanPerformanceAim";
import { HumanPerformanceFlightMode } from "./internal/HumanPerformanceFlightMode";
import { HumanPerformanceHits } from "./internal/HumanPerformanceHits";
import { HumanPerformanceLayers } from "./internal/HumanPerformanceLayers";
import { HumanPerformanceObject } from "./internal/HumanPerformanceObject";
import { HumanPerformanceRead } from "./internal/HumanPerformanceRead";
import { HumanPerformanceSimulation } from "./internal/HumanPerformanceSimulation";
import { HumanPerformanceSite } from "./internal/HumanPerformanceSite";
import { HumanPerformanceSoft } from "./internal/HumanPerformanceSoft";
import { HumanPerformanceState } from "./internal/HumanPerformanceState";
import { HumanPerformanceTether } from "./internal/HumanPerformanceTether";
import { HumanPropFlight } from "./internal/HumanPropFlight";
import { fractureHumanPerformanceProp } from "./internal/fractureHumanPerformanceProp";

/**
 * Resolves an authored performance and reads its people and props at film
 * seconds.
 *
 * Construction places each action from the performer's state at entry. It
 * admits cuts through the action's interrupt rules and checks any supplied
 * production rules. A proximity cut uses the first crossing found by the
 * schedule's sampled search. The action retains its end if that search finds no
 * crossing.
 *
 * Authored airborne turns use staged rotation by default. Physical mode solves
 * for angular momentum. Explicit momentum always uses the physical solver.
 *
 * Each instance prepares its own displayed pose, contacts and prop custody. A
 * person stands at their starting place before their first action. Pose reads
 * apply transitions and additive layers and can occur in any order. Use
 * {@link simulate} to bake an overlapping window of solved body motion.
 */
export class AutoMovieMotionHumanPerformance {
  /** The resolved schedule. Use {@link instant} to resolve a played action cue. */
  public readonly schedule: IAutoMovieSchedule;

  /** Seconds from 0 to the last action's end. */
  public readonly duration: number;

  /** The people, as the performance was given them. */
  public readonly performers: readonly IAutoMovieMotionHumanPerformer[];

  /*
   * Everything the performance resolved, which its readers share.
   */
  private readonly resolved: IAutoMovieMotionHumanPerformanceState;

  /*
   * The input it was resolved from, which a baked copy resolves again: the
   * resolution is a pure function of it.
   */
  private readonly input: IAutoMovieMotionHumanPerformance.IInput;

  /*
   * Windows baked through the solver, in bake order; the latest one covering an
   * instant shows there. Set only on the copy `simulate` returns.
   */
  private windows: readonly HumanPerformanceSimulation.IReading[] = [];

  /**
   * Resolve the film schedule and prepare its playback.
   *
   * @param input The chain seed, the performers, the props and the composition.
   * @param observation Optional native airborne-work observer, forwarded to the
   *   airborne solve as a diagnostic; the authored input and physical admission
   *   are unchanged.
   * @throws {AutoMovieMotionHumanRefusal} When placement, cuts, contacts,
   *   constraints or a requested physical flight refuse the performance.
   */
  public constructor(
    input: IAutoMovieMotionHumanPerformance.IInput,
    observation?: ReturnType<
      typeof AutoMovieEngineMotionAirborneRotation.observe
    >,
  ) {
    // Resolved afresh on every construction: a resolution is a pure function
    // of its input, so it owns its plans, schedule and contacts and shares
    // nothing with another performance's. A refusal is thrown each time.
    this.resolved = new HumanPerformanceState(
      input,
      HumanPerformanceFlightMode(input),
      observation,
    );
    this.input = input;
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
    return this.shown(subject, seconds, this.windows.length);
  }

  /**
   * Bake a window of the performance through the engine's solver
   * (`HumanPerformanceSimulation`): once, at the solver's fixed step, from this
   * performance's displayed bones, forces, grips and solids.
   *
   * The returned performance is this one with the window laid over it: its
   * `pose` and `bones` read the solved bodies inside the window, where the
   * solver owns a segment, and this performance's own motion everywhere else;
   * the window hands back to that motion continuously at its end. Every other
   * reading (postures, props, hits) is this performance's. The bake is
   * asynchronous because the solver's native module loads so.
   *
   * @param window The window.
   * @param mode The physical policy of the window's bodies: `kinematic` shows
   *   this performance's own motion.
   * @returns The performance with the window baked.
   * @throws {AutoMovieMotionHumanRefusal} When the window is outside the film,
   *   names an unknown performer, or reaches an obstacle with openings.
   */
  public async simulate(
    window: IAutoMovieMotionHumanSimulationWindow,
    mode: IAutoMoviePerformanceMode,
  ): Promise<AutoMovieMotionHumanPerformance> {
    const reading: HumanPerformanceSimulation.IReading =
      await HumanPerformanceSimulation.bake(this, this.resolved, window, mode);
    const baked: AutoMovieMotionHumanPerformance =
      new AutoMovieMotionHumanPerformance(this.input);
    baked.windows = [...this.windows, reading];
    return baked;
  }

  /**
   * The windows baked into this performance, in bake order.
   *
   * @returns Each window, its mode and the engine's simulation of it.
   */
  public simulations(): readonly IAutoMovieMotionHumanSimulation[] {
    return this.windows.map(
      (
        reading: HumanPerformanceSimulation.IReading,
      ): IAutoMovieMotionHumanSimulation => reading.record,
    );
  }

  /*
   * The pose shown under the first `depth` windows: the latest covering one
   * over what lies beneath it.
   */
  private shown(
    subject: string,
    seconds: number,
    depth: number,
  ): IAutoMoviePose {
    for (let index: number = depth - 1; index >= 0; index--) {
      const reading: HumanPerformanceSimulation.IReading = this.windows[index]!;
      if (HumanPerformanceSimulation.covers(reading, subject, seconds))
        return HumanPerformanceSimulation.pose(
          reading,
          subject,
          seconds,
          this.shown(subject, seconds, index),
        );
    }
    return HumanPerformanceRead.pose(this.resolved, subject, seconds);
  }

  /**
   * A person's active posture at a film second, before layers: the posture the
   * active action writes, or the standing posture before the first.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns The posture.
   */
  public posture(
    subject: string,
    seconds: number,
  ): IAutoMovieMotionHumanPosture {
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
    const reading: HumanPerformanceSimulation.IReading | undefined =
      this.windows.find(
        (candidate: HumanPerformanceSimulation.IReading): boolean =>
          HumanPerformanceSimulation.covers(candidate, subject, seconds),
      );
    return reading === undefined
      ? HumanPerformanceRead.bones(this.resolved, subject, seconds)
      : poseBones(
          reading.performers.get(subject)!.body,
          this.pose(subject, seconds),
        );
  }

  /**
   * A prop's world frame at a film second: its rest frame until a hand grips
   * it, then carried by the gripping hand with the offset it had when the grip
   * closed, and left where the last grip released it.
   *
   * A grip is any action's contact window of kind `grip` on a hand whose
   * support is this prop. The hand's grip socket rides the hand bone, so the
   * prop is a child of the hand while held: the rigid coupling of the engine's
   * `IAutoMovieAttachment`, a bone plus an offset, with the offset captured at
   * the grip's start instead of authored. When grips overlap (a handover), the
   * one that closed last carries the prop. A hold an action leaves
   * (`IHumanActionPlan.holds`) is a grip lasting until a later action takes
   * that hand over. A released prop stays where the last grip to end released
   * it, unless an action launched it: then it flies from the launch and rests
   * where it struck (`HumanPropFlight`) until a later grip takes it.
   *
   * @param subject The prop.
   * @param seconds Film seconds.
   * @returns Its frame.
   */
  public prop(subject: string, seconds: number): IAutoMovieRigidTransform {
    return HumanPerformanceRead.prop(this.resolved, subject, seconds);
  }

  /**
   * A prop's named point as a world frame at a film second
   * (`HumanPerformanceSite`).
   *
   * @param subject The prop.
   * @param point The point's name.
   * @param seconds Film seconds.
   * @returns The point's world frame, metres.
   * @throws {AutoMovieMotionHumanRefusal} When the prop or its point is
   *   unknown.
   */
  public site(
    subject: string,
    point: string,
    seconds: number,
  ): IAutoMovieRigidTransform {
    return HumanPerformanceSite(this.resolved, subject, point, seconds);
  }

  /**
   * A line between props at a film second (`IAutoMovieMotionHumanTether`): its
   * ends, its line out, whether it runs taut, and the points it is drawn
   * through, straight when taut and a catenary when slack.
   *
   * @param subject The prop the line runs from.
   * @param id The line's id on that prop.
   * @param seconds Film seconds.
   * @returns The line as it lies.
   */
  public tether(
    subject: string,
    id: string,
    seconds: number,
  ): IAutoMovieMotionHumanTether.ISpan {
    return HumanPerformanceTether.span(
      this.resolved,
      subject,
      id,
      seconds,
      (prop: string, at: number): IAutoMovieRigidTransform =>
        HumanPerformanceRead.prop(this.resolved, prop, at),
    );
  }

  /**
   * One input per coupled degree of freedom a prop's acts or tracks have moved
   * by a film second (`HumanPerformanceObject.state`), in the latest begun
   * writer's coordinate. A later writer of another coordinate of the same
   * degree replaces the old one; after its end its last travel holds. A degree
   * absent from the record starts at its leader's zero.
   *
   * @param subject The prop.
   * @param seconds Film seconds.
   * @returns Travel by articulation id, in each articulation's own unit.
   */
  public state(subject: string, seconds: number): Record<string, number> {
    const prop: IAutoMovieMotionHumanProp | undefined =
      this.resolved.props.get(subject);
    if (prop === undefined)
      throw HumanPerformanceRead.missing("prop", subject, [
        ...this.resolved.props.keys(),
      ]);
    return HumanPerformanceObject.state(this.resolved, prop, seconds);
  }

  /**
   * A prop's flights in film order (`HumanPropFlight`): each launch an action
   * published, its engine flight and its first contact, for audits and the hit
   * record.
   *
   * @param subject The prop.
   * @returns The flights; none for a prop never launched.
   */
  public flights(
    subject: string,
  ): readonly IAutoMovieMotionHumanPropFlight.IFlight[] {
    return HumanPropFlight.flights(this.resolved, subject);
  }

  /**
   * One ball's play (`HumanBallPlay.read`): its hand holds, launches and flight
   * contacts in film order, for a sport to credit its result.
   *
   * @param subject The ball.
   * @returns The play; no events for a ball never held or launched.
   */
  public play(subject: string): IAutoMovieMotionHumanBallPlay {
    return HumanBallPlay.read(this.resolved, subject);
  }

  /**
   * Every hit of the performance in time order, or those on one person or prop
   * (`HumanPerformanceHits`): melee stops, blasts and flight contacts, each as
   * the one shared interaction record.
   *
   * @param subject The struck person or prop; every hit when absent.
   * @returns The hits.
   */
  public hits(subject?: string): readonly IAutoMovieInteractionEvent[] {
    return HumanPerformanceHits.hits(this.resolved, subject);
  }

  /**
   * Stage the model's replacement at a recorded hit on the placed prop.
   *
   * @param request The recorded hit, placed prop, its model and the authored
   *   split budget.
   * @returns The replacement plan, or null for a missing hit or an intact
   *   model.
   */
  public fracture<Piece extends IAutoMovieMotionHumanObject.IModel>(
    request: IAutoMovieMotionHumanPropFracture.IRequest<Piece>,
  ): IAutoMovieMotionHumanPropFracture.IPlan<Piece> | null {
    return fractureHumanPerformanceProp(
      this,
      this.resolved.props.has(request.subject),
      request,
    );
  }

  /**
   * A soft prop's particle positions at a film second: its lattice solved once
   * over the performance from the displayed poses at its domain's fixed step,
   * and read between the two steps around the second, so a seek costs no solve
   * and every frame rate reads the same state (`HumanPerformanceSoft`).
   *
   * @param subject The soft prop.
   * @param seconds Film seconds.
   * @returns World metres, row-major `[x, y, z, ...]`.
   * @throws {AutoMovieMotionHumanRefusal} When the prop is not soft or the
   *   performance outlasts its domain's step budget.
   */
  public soft(subject: string, seconds: number): number[] {
    return HumanPerformanceSoft.at(this.resolved, subject, seconds);
  }

  /**
   * The force a soft prop pulls a gripping hand with at a film second
   * (`HumanPerformanceSoft.load`): the compliant solver's force on the particle
   * the hand holds, held over its step.
   *
   * @param subject The soft prop.
   * @param person The gripping person.
   * @param side The hand.
   * @param seconds Film seconds.
   * @returns Newtons on the hand, world frame; zero when the hand does not hold
   *   the prop or its domain declares no compliance.
   */
  public softLoad(
    subject: string,
    person: string,
    side: AutoMovieHumanSide,
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
   * Resolve a film second from an absolute time, a played action event, or a
   * cue track.
   *
   * An action contributes events within its realized span, including an event
   * at the exact cut. Without an event name, use its played contact or entry
   * second. A declared cue track keeps its own film seconds. A named occurrence
   * counts matching played events in declaration order. An offset applies to
   * the selected second.
   *
   * @param at The instant.
   * @returns The film second.
   * @throws {AutoMovieMotionHumanRefusal} For an unknown anchor or cue track,
   *   or an absent event occurrence.
   */
  public instant(at: AutoMovieMotionHumanScheduledInstant): number {
    return HumanPerformanceLayers.instant(this.resolved, at);
  }

  /**
   * A person's placed actions, in order.
   *
   * @param subject The person.
   * @returns The segments.
   */
  public segments(subject: string): readonly IAutoMovieMotionHumanSegment[] {
    return HumanPerformanceRead.segments(this.resolved, subject);
  }

  /**
   * The actions a person performs over their placed actions, in placement
   * order: each rides a carrier and takes only its claimed channels.
   *
   * @param subject The person.
   * @returns The overlays.
   */
  public overlays(
    subject: string,
  ): readonly IAutoMovieMotionHumanSegment.IOverlay[] {
    return HumanPerformanceRead.overlays(this.resolved, subject);
  }

  /**
   * A target's world point and outward normal at a film second.
   *
   * @param target The target.
   * @param seconds Film seconds.
   * @param frame The aiming person's own frame and body, including their
   *   optional subject id so a carried or mounted prop is read on the supplied
   *   bones, as a self target is.
   * @returns The aim.
   */
  public aim(
    target: IAutoMovieMotionTarget,
    seconds: number,
    frame: IAutoMovieMotionHumanPerformanceAim.IFrame,
  ): IAimResult {
    return HumanPerformanceAim.aim(this.resolved, target, seconds, frame);
  }
}

/** The record of `IAimResult`'s site. */
type IAimResult = { point: IAutoMovieVector3; normal: IAutoMovieVector3 };
