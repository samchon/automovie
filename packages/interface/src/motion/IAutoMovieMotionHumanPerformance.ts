import type { IAutoMovieInteractionEvent } from "../cinematics/IAutoMovieInteractionEvent";
import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePose } from "../pose/IAutoMoviePose";
import type { IAutoMovieResolvedBone } from "../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";
import type { IAutoMovieCheckLegality } from "./IAutoMovieCheckLegality";
import type { IAutoMovieComposition } from "./IAutoMovieComposition";
import type { IAutoMovieSchedule } from "./IAutoMovieSchedule";
import type { IAutoMovieScheduleCue } from "./IAutoMovieScheduleCue";
import type { AutoMovieMotionHumanScheduledInstant } from "./AutoMovieMotionHumanScheduledInstant";
import type { IAutoMovieMotionHumanActionLaw } from "./IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanLayer } from "./IAutoMovieMotionHumanLayer";
import type { IAutoMovieMotionHumanPosture } from "./IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanBlast } from "./IAutoMovieMotionHumanBlast";
import type { IAutoMovieMotionHumanForce } from "./IAutoMovieMotionHumanForce";
import type { IAutoMovieMotionHumanObject } from "./IAutoMovieMotionHumanObject";
import type { IAutoMovieMotionHumanObstacle } from "./IAutoMovieMotionHumanObstacle";
import type { IAutoMovieMotionHumanPerformanceAim } from "./IAutoMovieMotionHumanPerformanceAim";
import type { IAutoMovieMotionHumanPerformer } from "./IAutoMovieMotionHumanPerformer";
import type { IAutoMovieMotionHumanProp } from "./IAutoMovieMotionHumanProp";
import type { IAutoMovieMotionHumanPropFlight } from "./IAutoMovieMotionHumanPropFlight";
import type { IAutoMovieMotionHumanPropFracture } from "./IAutoMovieMotionHumanPropFracture";
import type { IAutoMovieMotionHumanSegment } from "./IAutoMovieMotionHumanSegment";
import type { IAutoMovieMotionHumanSimulation } from "./IAutoMovieMotionHumanSimulation";

/**
 * A performance of people and props: their chained actions placed on the film
 * clock, every cut checked against the actions' interrupt tables, and each
 * person's displayed pose a pure function of film seconds.
 *
 * Construction resolves the composition with the engine's schedule resolver.
 * Each intent's timing comes from its law's plan, made from the state the
 * performer is in when the intent starts: the previous action's displayed pose
 * and velocity at its cut or end, its posture and its planted feet. A cut (an
 * intent's `until`) is legal only inside a window of the cut action's interrupt
 * table for the next action; otherwise construction throws with the legal
 * windows. A `proximity` cut is found by scanning the 24 Hz grid for the first
 * frame within the distance and bisecting 20 times, about 1e-7 s, deterministic
 * on a fixed grid whose last sample is the action's end; a distance never met
 * leaves the action uncut. Given rules, the placed schedule is checked with the
 * engine's legality check and a violation refuses the performance. An input
 * equal to one the process resolved recently reads that resolution again
 * (`HumanPerformanceState.of`): the resolution is a pure function of its
 * input.
 *
 * Sampling a person at a second takes the active action's posture, resolves it
 * to a pose, adds the decaying inertialization offset of the transition that
 * entered it, re-solves every planted or gripping limb onto its goal so no
 * contact slides, and clamps to the range of motion ({@link HumanSegment}). A
 * person before their first action stands at their starting place. Additive
 * layers (gaze, breathing) apply over every action without cutting it. While
 * the schedule is resolved, a person's poses may read people whose actions are
 * not placed yet, so nothing is cached until every action is placed; then
 * caches and transition offsets start afresh.
 */
export interface IAutoMovieMotionHumanPerformance {
  /** The resolved schedule. */
  readonly schedule: IAutoMovieSchedule;

  /** Seconds from 0 to the last action's end. */
  readonly duration: number;

  /** The people, as the performance was given them. */
  readonly performers: readonly IAutoMovieMotionHumanPerformer[];

  /**
   * A person's displayed canonical pose at a film second.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns The pose.
   */
  pose(subject: string, seconds: number): IAutoMoviePose;

  /**
   * A person's active posture at a film second, before layers: the posture the
   * active action writes, or the standing posture before the first.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns The posture.
   */
  posture(subject: string, seconds: number): IAutoMovieMotionHumanPosture;

  /**
   * A person's world bones at a film second.
   *
   * @param subject The person.
   * @param seconds Film seconds.
   * @returns Resolved bones by rig bone.
   */
  bones(
    subject: string,
    seconds: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

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
   * (`IAutoMovieMotionHumanActionPlan.holds`) is a grip lasting until a later
   * action takes that hand over. A released prop stays where the last grip to
   * end released it, unless an action launched it: then it flies from the
   * launch and rests where it struck (`HumanPropFlight`) until a later grip
   * takes it.
   *
   * @param subject The prop.
   * @param seconds Film seconds.
   * @returns Its frame.
   */
  prop(subject: string, seconds: number): IAutoMovieRigidTransform;

  /**
   * A prop's named point as a world frame at a film second: the prop's
   * displayed frame composed with the point's frame on the posed prop, so a
   * contact on a moving part (a pedal on a turning crank) is read on that part.
   * Absent from a performance that poses no prop points.
   *
   * @param subject The prop.
   * @param point The point's name.
   * @param seconds Film seconds.
   * @returns The point's world frame, metres.
   */
  site?(
    subject: string,
    point: string,
    seconds: number,
  ): IAutoMovieRigidTransform;
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
  state(subject: string, seconds: number): Record<string, number>;

  /**
   * A prop's flights in film order (`HumanPropFlight`): each launch an action
   * published, its engine flight and its first contact, for audits and the hit
   * record.
   *
   * @param subject The prop.
   * @returns The flights; none for a prop never launched.
   */
  flights(subject: string): readonly IAutoMovieMotionHumanPropFlight.IFlight[];

  /**
   * Every hit of the performance in time order, or those on one person or prop
   * (`HumanPerformanceHits`): melee stops, blasts and flights' first contacts,
   * each as the one shared interaction record.
   *
   * @param subject The struck person or prop; every hit when absent.
   * @returns The hits.
   */
  hits(subject?: string): readonly IAutoMovieInteractionEvent[];

  /** Stages a breakaway prop at a recorded hit, or returns null while intact. */
  fracture<Piece extends IAutoMovieMotionHumanObject.IModel>(
    request: IAutoMovieMotionHumanPropFracture.IRequest<Piece>,
  ): IAutoMovieMotionHumanPropFracture.IPlan<Piece> | null;

  /**
   * A soft prop's particle positions at a film second: its lattice solved once
   * over the performance from the displayed poses at its domain's fixed step,
   * and read between the two steps around the second, so a seek costs no solve
   * and every frame rate reads the same state (`HumanPerformanceSoft`).
   *
   * @param subject The soft prop.
   * @param seconds Film seconds.
   * @returns World metres, row-major `[x, y, z, ...]`.
   * @throws {AutoMovieMotionHumanRefusal} When the prop is not soft or the performance
   *   outlasts its domain's step budget.
   */
  soft(subject: string, seconds: number): number[];

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
  softLoad(
    subject: string,
    person: string,
    side: "left" | "right",
    seconds: number,
  ): IAutoMovieVector3;

  /**
   * The film second of an instant: a second as given, or a named instant of an
   * anchored action or of a cue track.
   *
   * @param at The instant.
   * @returns The film second.
   * @throws {AutoMovieMotionHumanRefusal} When nothing is anchored or tracked under the name,
   *   or it has no such event.
   */
  instant(at: AutoMovieMotionHumanScheduledInstant): number;

  /**
   * A person's placed actions, in order.
   *
   * @param subject The person.
   * @returns The segments.
   */
  segments(subject: string): readonly IAutoMovieMotionHumanSegment[];

  /**
   * The actions a person performs over their placed actions, in placement
   * order: each rides a carrier and takes only its claimed channels.
   *
   * @param subject The person.
   * @returns The overlays.
   */
  overlays(subject: string): readonly IAutoMovieMotionHumanSegment.IOverlay[];

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
  aim(
    target: IAutoMovieMotionTarget,
    seconds: number,
    frame: IAutoMovieMotionHumanPerformanceAim.IFrame,
  ): {
    /** Resolved target point in world metres. */
    point: IAutoMovieVector3;
    /** Resolved target's outward surface normal in world coordinates. */
    normal: IAutoMovieVector3;
  };

  /**
   * The windows baked through the engine's solver, in bake order
   * (`AutoMovieMotionHumanPerformance.simulate`); inside each, the solver's contacts take over
   * the declared plants of the parts it owns, which the verdicts read
   * (`HumanVerdicts`). Absent or empty for a performance with none.
   *
   * @returns Each window, its mode and the engine's simulation of it.
   */
  simulations?(): readonly IAutoMovieMotionHumanSimulation[];
}

/**
 * A performance of people and props: their chained actions placed on the film
 * clock, every cut checked against the actions' interrupt tables, and each
 * person's displayed pose a pure function of film seconds.
 *
 * Construction resolves the composition with the engine's schedule resolver.
 * Each intent's timing comes from its law's plan, made from the state the
 * performer is in when the intent starts: the previous action's displayed pose
 * and velocity at its cut or end, its posture and its planted feet. A cut (an
 * intent's `until`) is legal only inside a window of the cut action's interrupt
 * table for the next action; otherwise construction throws with the legal
 * windows. A `proximity` cut is found by scanning the 24 Hz grid for the first
 * frame within the distance and bisecting 20 times, about 1e-7 s, deterministic
 * on a fixed grid whose last sample is the action's end; a distance never met
 * leaves the action uncut. Given rules, the placed schedule is checked with the
 * engine's legality check and a violation refuses the performance. An input
 * equal to one the process resolved recently reads that resolution again
 * (`HumanPerformanceState.of`): the resolution is a pure function of its
 * input.
 *
 * Sampling a person at a second takes the active action's posture, resolves it
 * to a pose, adds the decaying inertialization offset of the transition that
 * entered it, re-solves every planted or gripping limb onto its goal so no
 * contact slides, and clamps to the range of motion ({@link HumanSegment}). A
 * person before their first action stands at their starting place. Additive
 * layers (gaze, breathing) apply over every action without cutting it. While
 * the schedule is resolved, a person's poses may read people whose actions are
 * not placed yet, so nothing is cached until every action is placed; then
 * caches and transition offsets start afresh.
 */
export namespace IAutoMovieMotionHumanPerformance {
  /** The callable constructor and static factories. */
  export interface IConstructor {
    /**
     * Resolve a performance.
     *
     * @param input The chain seed, the performers, the props and the
     *   composition.
     */
    new (
      input: IAutoMovieMotionHumanPerformance.IInput,
    ): IAutoMovieMotionHumanPerformance;
  }

  /**
   * Construction input for one deterministic performance: seed, performers,
   * props, composition and optional environmental constraints.
   */
  export interface IInput {
    /** The chain seed every draw starts from. */
    seed: string;

    /** The people. */
    performers: IAutoMovieMotionHumanPerformer[];

    /** The props actions aim at. */
    props?: IAutoMovieMotionHumanProp[];

    /** What everyone does. */
    composition: IAutoMovieComposition;

    /**
     * Authored airborne turns use deterministic staged rotation by default,
     * preserving the law's centre path and fitted articulation without claiming
     * angular-momentum conservation. The existing landing pose requires
     * complete revolutions on each axis; nonclosing fractional turns need a
     * compatible landing outcome and are refused. Physical solves turns from
     * the composed body's inertia and take-off limit but does not repair that
     * legacy landing limitation. A flight with explicitly supplied momentum
     * always remains physical.
     */
    flight?: "staged" | "physical";

    /**
     * The production's legality rules, such as `KickboxingRules.rules`, checked
     * against the placed schedule with the engine's `checkLegality`;
     * any violation refuses the performance with every broken rule in the
     * message. None when absent.
     */
    rules?: readonly IAutoMovieCheckLegality.IRule[];

    /**
     * Laws of the production's own, performed like the vocabulary's under the
     * names they carry: an act the vocabulary lacks, written on the same kernel
     * (a clock, a base and part primitives), or a row of an existing law with
     * some of its parameters fixed. A name the vocabulary already has, or one
     * given twice, refuses the performance. A registered law draws from streams
     * keyed by its own name, so registering it changes no other action's draws.
     * `AutoMovieMotionHumanChain.extend` gives its typed method.
     */
    laws?: readonly IAutoMovieMotionHumanActionLaw<never>[];

    /**
     * Additive layers per subject, applied in order over the person's actions:
     * each for the whole film, or scheduled in a window between two instants
     * (`IAutoMovieMotionHumanLayer.IScheduled`).
     */
    layers?: Readonly<
      Record<
        string,
        readonly (
          | IAutoMovieMotionHumanLayer
          | IAutoMovieMotionHumanLayer.IScheduled
        )[]
      >
    >;

    /**
     * Tracks of named instants that belong to no action, by track name: a
     * dialogue's line starts and accents, a score's beats (`AutoMovieMotionHumanCue` builds
     * both). An action is synced to one (`AutoMovieMotionHumanChain.sync`) and cut on one
     * (`until`) as on another action's events; a track's name is used like an
     * anchor, so no action may be anchored under it.
     */
    cues?: Readonly<Record<string, readonly IAutoMovieScheduleCue[]>>;

    /**
     * Forces on the performers: impulses at an instant and forces sustained
     * over a span, read by the reactions the composition places
     * (`IAutoMovieMotionHumanActionContext.forces`). A force starts no action.
     * None when absent.
     */
    forces?: readonly IAutoMovieMotionHumanForce[];

    /**
     * What stands in the performers' way: the scene's walls and solid objects
     * with their openings (`HumanObstacle`). A law that moves a body across the
     * floor reads them through its context and refuses a path through a solid;
     * none when absent, and then every path is free.
     */
    obstacles?: readonly IAutoMovieMotionHumanObstacle[];

    /**
     * Blasts in the scene: each gives a hit to every person within its radius
     * at its instant (`HumanBlast`, `hits`). None when absent.
     */
    blasts?: readonly IAutoMovieMotionHumanBlast.IBlast[];
  }
}
