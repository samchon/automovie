import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanScheduledInstant,
  IAutoMovieInteractionEvent,
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
  IAutoMovieMotionTarget,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieSchedule,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPerformanceAim } from "./HumanPerformanceAim";
import { HumanPerformanceHits } from "./HumanPerformanceHits";
import { HumanPerformanceLayers } from "./HumanPerformanceLayers";
import { HumanPerformanceObject } from "./HumanPerformanceObject";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPerformanceSoft } from "./HumanPerformanceSoft";
import { HumanPerformanceState } from "./HumanPerformanceState";
import { HumanPropFlight } from "./HumanPropFlight";
import { HumanPropFracture } from "./HumanPropFracture";

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
  public readonly performers: readonly IAutoMovieMotionHumanPerformer[];

  /** Everything the performance resolved, which its readers share. */
  private readonly resolved: IAutoMovieMotionHumanPerformanceState;

  /**
   * Resolve a performance.
   *
   * @param input The chain seed, the performers, the props and the composition.
   */
  public constructor(input: IAutoMovieMotionHumanPerformance.IInput) {
    this.resolved = HumanPerformanceState.of(input);
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
  public prop(subject: string, seconds: number): IAutoMovieRigidTransform {
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
    const prop: IAutoMovieMotionHumanProp | undefined =
      this.resolved.props.get(subject);
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
  public flights(
    subject: string,
  ): readonly IAutoMovieMotionHumanPropFlight.IFlight[] {
    return HumanPropFlight.flights(this.resolved, subject);
  }

  /**
   * Every hit of the performance in time order, or those on one person or
   * prop (`HumanPerformanceHits`): melee stops, blasts and flight contacts,
   * each as the one shared interaction record.
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
   * @param request The recorded hit, placed prop, its model and the authored split budget.
   * @returns The replacement plan, or null for a missing hit or an intact model.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the exact hit and when the model stays intact.
   * @evidence contracts/development/implementation.md#principled-implementation Looks up a recorded hit on the chosen subject and passes its film clock and this performance's prop reader to the breakaway planner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The performance supplies its existing event and prop placement. HumanPropFracture owns the split's staging.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No derived strike strength or fabricated hit. The named model owns acceptance of the authored budget.
   * @evidence contracts/development/implementation.md#efficient-algorithms Selects the hit in one pass over the subject's records, then prepares one replacement.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the performance hit and frame readers. Call once and sample the returned plan during playback.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The performance retains no fracture plans. A returned plan with a remainder borrows the performance's prop reader for its lifetime.
   */
  public fracture<Piece extends IAutoMovieMotionHumanObject.IModel>(
    request: IAutoMovieMotionHumanPropFracture.IRequest<Piece>,
  ): IAutoMovieMotionHumanPropFracture.IPlan<Piece> | null {
    const subject: string = request.subject;
    if (!this.resolved.props.has(subject)) return null;
    const hit: IAutoMovieInteractionEvent | undefined = this.hits(subject).find(
      (event: IAutoMovieInteractionEvent): boolean =>
        event.kind === "hit" && event.id === request.hit,
    );
    return hit === undefined
      ? null
      : HumanPropFracture(
          request,
          hit,
          (seconds: number): IAutoMovieRigidTransform =>
            this.prop(subject, seconds),
        );
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
   * @param frame The aiming person's own frame and body, including their optional subject id so a carried or mounted prop is read on the supplied bones, as a self target is.
   * @returns The aim.
   */
  public aim(
    target: IAutoMovieMotionTarget,
    seconds: number,
    frame: IAutoMovieMotionHumanPerformanceAim.IFrame,
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
    return HumanPerformanceAim.aim(this.resolved, target, seconds, frame);
  }
}
