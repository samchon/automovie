import type { IAutoMovieHumanoidSurfaces } from "../../../pose/IAutoMovieHumanoidSurfaces";
import type { IAutoMoviePose } from "../../../pose/IAutoMoviePose";
import type { IAutoMoviePoseResolution } from "../../../pose/IAutoMoviePoseResolution";
import type { IAutoMovieMotionEvent } from "../../IAutoMovieMotionEvent";
import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import type { AutoMovieMotionHumanChannelClaim } from "../compose/AutoMovieMotionHumanChannelClaim";
import type { IAutoMovieMotionHumanEvaluation } from "../compose/IAutoMovieMotionHumanEvaluation";
import type { IAutoMovieMotionHumanPlayback } from "../perform/IAutoMovieMotionHumanPlayback";
import type { IAutoMovieHumanPostureRotation } from "../posture/IAutoMovieHumanPostureRotation";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanBalance } from "./IAutoMovieMotionHumanBalance";
import type { IAutoMovieMotionHumanBase } from "./IAutoMovieMotionHumanBase";
import type { IAutoMovieMotionHumanContactWindow } from "./IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionHumanFlight } from "./IAutoMovieMotionHumanFlight";
import type { IAutoMovieMotionHumanFollow } from "./IAutoMovieMotionHumanFollow";
import type { IAutoMovieMotionPropDrive } from "./IAutoMovieMotionPropDrive";
import type { IAutoMovieMotionPropHold } from "./IAutoMovieMotionPropHold";
import type { IAutoMovieMotionPropLaunch } from "./IAutoMovieMotionPropLaunch";
import type { IAutoMovieMotionPropMount } from "./IAutoMovieMotionPropMount";
import type { IAutoMovieMotionPropWear } from "./IAutoMovieMotionPropWear";
import type { IAutoMovieMotionWeaponContact } from "./IAutoMovieMotionWeaponContact";
import type { IAutoMovieMotionWeaponPath } from "./IAutoMovieMotionWeaponPath";
import type { IAutoMovieMotionWieldedTool } from "./IAutoMovieMotionWieldedTool";

/**
 * One planned instance of an action: its duration in seconds, its named events
 * and contact windows as shares of that duration, its decisive instant, and its
 * posture as a pure function of the seconds since the action's start.
 *
 * The plan is computed once per instance and carries whatever the law decided
 * (footprints, a flight parabola, a strike path), so every frame is a closed
 * evaluation of `posture`, independent of the frame grid.
 */
export interface IAutoMovieMotionHumanActionPlan {
  /** Duration, seconds; positive. */
  duration: number;

  /** Named instants, shares of the duration. */
  events: IAutoMovieMotionEvent[];

  /** Contact windows, shares of the duration. */
  contacts: IAutoMovieMotionHumanContactWindow[];

  /**
   * The balance window this plan actually uses, or null when its balance is
   * off.
   */
  balanceWindow?: IAutoMovieMotionHumanBalance.Window;

  /**
   * Physical phase in action seconds. Null marks a kinematic outcome of a
   * physical law. Omission preserves its whole-span judgement.
   */
  physicalWindow?: IAutoMovieMotionHumanActionPlan.IPhysicalWindow | null;

  /**
   * Seconds since the action's start, from and to, over which `posture` returns
   * one and the same posture, for a plan that holds still there (a stand
   * without sway once it has settled). A reader may treat the body as not
   * moving there; absent, no such window is declared.
   */
  still?: readonly [number, number];

  /**
   * Seconds since the action's start, from and to, over which `posture` keeps
   * its root, its heading, its trunk and both legs' goals and joints one and
   * the same while only the head, the arms or the hands move (a composed action
   * whose primitives write only those, over a base that holds still): every
   * record a leg fit reads is the same there, so a reader may keep the legs'
   * fit of one second for another. Absent, no such window is declared.
   */
  legsStill?: readonly [number, number];

  /**
   * The channels the plan's own movements write, when it is composed of part
   * primitives over a base: what an overlay takes from its carrier. Absent for
   * a plan that writes the whole body.
   */
  channels?: readonly AutoMovieMotionHumanChannelClaim[];

  /**
   * The channels whose writer follows another performer live, each over its
   * window (an arm course that tracks a partner's region a feedback delay
   * earlier), so a plan-level reading that needs no such arm there (the
   * display's swivel course of the plan's own limb goals) reads the plan
   * without it inside the window and never reads that partner. Absent, no
   * channel follows anyone.
   */
  follows?: readonly IAutoMovieMotionHumanFollow[];

  /**
   * Claimed channels whose authored transport starts from the displayed entry
   * pose. Their planned movement already includes acquisition from the carrier.
   * Release of these channels still follows the overlay handback.
   */
  enteredChannels?: readonly AutoMovieMotionHumanChannel[];

  /**
   * What this instance lets an overlay take, where its parameters decide it
   * apart from its law (`IAutoMovieMotionHumanActionLaw.yields`): a carry in
   * one hand yields its free arm, one in both hands none. The law's when
   * absent.
   */
  yields?: readonly AutoMovieMotionHumanChannelClaim[];

  /**
   * The base the action leaves the body on at its end, declared by an action
   * that changes what carries the body: sitting down declares the seat,
   * kneeling the kneel, rising the stand. Absent for an action that keeps the
   * base it is entered on, which the performance then passes on to the next
   * action unchanged (`IAutoMovieMotionHumanEntryState.base`).
   */
  base?: IAutoMovieMotionHumanBase;

  /**
   * The tool the action works with in a hand: the held prop and which of its
   * affordances are its working point and its edge. Another performer's law
   * that answers this action (a parry of a cut, a flinch from a muzzle) reads
   * the tool here through `IAutoMovieMotionHumanActionContext.action`. Absent
   * for an action performed with the bare body.
   */
  wields?: IAutoMovieMotionWieldedTool;

  /**
   * Seconds from the start to the decisive instant (an impact, a landing, a
   * grip), when the action has one.
   */
  contact?: number;

  /**
   * Seconds from the start to the contact a feint pretends: the instant its
   * committed twin would land, which an observer who takes the feint for the
   * real action prepares for. Present only on an action that shows a decisive
   * instant it never reaches, so it never accompanies `contact`.
   */
  feigned?: number;

  /**
   * The posture at a second of the action.
   *
   * @param seconds Seconds since the action's start, in [0, duration]; outside,
   *   the nearest end.
   * @param channels Optional demand for these channels only. A reader using it
   *   inspects only these channels; implementations may still compute the whole
   *   posture. Omission requests every channel.
   * @param resolution Optional exact FK source borrowed only for this
   *   synchronous unchanged-body evaluation; never retained in the plan,
   *   posture, preparation evidence or a returned callback.
   * @param projection Optional genuine same-body ROM projector borrowed for
   *   this call only; every actual direct joint is still projected, and unknown
   *   functions fall back to ordinary admission.
   * @param evaluation The explicit context of this evaluation, lent for this
   *   call only; passed on unchanged to every plan and primitive the posture
   *   reads at this evaluation, never retained.
   * @returns The borrowed posture; when a demand is supplied, only requested
   *   channels are guaranteed current.
   */
  posture(
    seconds: number,
    channels?: readonly AutoMovieMotionHumanChannel[],
    resolution?: IAutoMoviePoseResolution.ISource,
    projection?: (pose: IAutoMoviePose) => IAutoMoviePose,
    evaluation?: IAutoMovieMotionHumanEvaluation,
  ): IAutoMovieMotionHumanPosture;

  /**
   * Solve what the posture reads of other performers, props and committed
   * stops. While the schedule is resolved the posture reads them as the
   * placed performance shows them; once every action is placed, every stop
   * committed and every flight resolved, the performance calls this once on
   * every plan in dependency order (a plan reading another performer is
   * prepared after that performer's plan there), and from then on the posture
   * evaluates only what this solved. `contacts` may be a getter over the same
   * solution.
   */
  prepare?(): void;

  /**
   * The native playback phases a law attached to this plan
   * (`HumanPreparedPlayback.attach`), which a display leaf evaluates in place
   * of the posture reader; absent for a plan read only through `posture`.
   */
  playback?: IAutoMovieMotionHumanPlayback.IBinding;

  /**
   * Props this action leaves held: each persists into the performer's later
   * actions until one of them declares its own grip window on that hand for
   * that prop (a put-down, a hand-over, a drink), which takes the hand over.
   * While a hold persists and the active action does not drive that hand, the
   * performance carries the hand with the trunk and keeps its fingers, and the
   * prop rides the hand.
   */
  holds?: readonly IAutoMovieMotionPropHold[];

  /**
   * Props this action puts on the performer's body: from its instant the prop
   * rides the named bone with the offset it has there, as a worn hat, holster
   * or watch does, until a later grip takes it off
   * (`IAutoMovieMotionHumanProp.worn`).
   */
  wears?: readonly IAutoMovieMotionPropWear[];

  /**
   * Props this action sets on another prop's socket: an arrow nocked on a bow's
   * string. From its instant the prop rides that socket, posed where the other
   * prop's articulations put it at every second (the arrow drawn with the
   * string), until a later grip takes it off: a prop parented to a socket in
   * the scene graph, as a worn prop is to a bone.
   */
  mounts?: readonly IAutoMovieMotionPropMount[];

  /**
   * Articulations of props this action moves: a door's hinge the hand swings, a
   * trigger it presses, a slider it draws. Each writes the travel of one
   * articulation over a window of the action; the performance poses the prop by
   * them (`HumanPerformance.state`), and after a drive ends its last travel
   * holds. A drive writes travel only, never the prop's frame.
   */
  drives?: readonly IAutoMovieMotionPropDrive[];

  /**
   * Props this action sets flying: a thrown bottle at the hand's opening, an
   * arrow at the loose, a ball at the trigger's break. From its second the prop
   * leaves every grip and flies from the launch's point and velocity until its
   * flight ends (`HumanPerformance.flights`).
   */
  launches?: readonly IAutoMovieMotionPropLaunch[];

  /**
   * Hands this action drives with no contact window, such as a wave or a point.
   * A hand with a contact window is driven anyway. An action that drives a held
   * hand without taking its prop over is refused.
   */
  hands?: readonly ("left" | "right")[];

  /**
   * Striking surfaces this action moves on free paths, for the performance's
   * simultaneous-contact resolution: every active weapon of every person is
   * stopped at its first contact with another person's colliders, in time
   * order, each later weapon seeing the earlier stops
   * (`resolveAutoMovieContactEvents`).
   */
  weapons?: readonly IAutoMovieMotionWeaponPath[];

  /**
   * Receive this action's resolved contacts, once, after the schedule is placed
   * and before any pose is shown; a law that takes them replaces its own
   * contact scan. A stop changes the pose only, never the duration, the events
   * or the decisive instant.
   *
   * @param events This action's weapons' first contacts, in time order.
   */
  stop?(events: readonly IAutoMovieMotionWeaponContact[]): void;

  /**
   * Where within its target region a strike is aimed, as an offset from the
   * region's own point on the region's tangent plane, when this repeat of the
   * strike varies. The striker's aim, the defence that answers it and the
   * strike's record all read this one value, so they agree on the point.
   * Absent, the strike is aimed at the region's own point.
   */
  aimed?: IAutoMovieHumanoidSurfaces.ITangent;

  /**
   * The plan whose posture still writes the arm goals this plan's posture
   * replaced by the arm's angles (a coursed arm, `courseArmGoal`): a law-side
   * judgement of a goal (a strike's event on its target, a carried hold's
   * frame) reads it. Absent, the plan writes its own goals.
   */
  goals?: IAutoMovieMotionHumanActionPlan;

  /**
   * The span in which the body flies, touching nothing, and the angular
   * momentum it flies with. The performance turns the composed body through it
   * after placement (`HumanPerformanceFlight`): the shape the carrier, its
   * overlays and its layers give, integrated by conserved angular momentum,
   * handed back through `airborne`. Absent for an action with no flight, or one
   * whose flight does not turn.
   */
  flight?: IAutoMovieMotionHumanFlight;

  /**
   * Receive the flight's whole-body rotation, once, after placement and the
   * contacts and before any pose is shown, like `stop`: between take-off and
   * touchdown the plan then returns its posture with that `rotation`
   * (`IAutoMovieMotionHumanPosture.rotation`). It changes the pose only, never
   * the duration, the events or the decisive instant.
   *
   * @param rotation The rotation at a second of this action, seconds since its
   *   start.
   */
  airborne?(
    rotation: (seconds: number) => IAutoMovieHumanPostureRotation,
  ): void;
}

/** Prepared terms shared by an action plan and its readers. */
export namespace IAutoMovieMotionHumanActionPlan {
  /** The closed physical phase on the plan's own clock, in seconds. */
  export interface IPhysicalWindow {
    /** Seconds from the action start to the beginning of the physical phase. */
    from: number;

    /** Seconds from the action start to the end of the physical phase. */
    to: number;
  }
}
