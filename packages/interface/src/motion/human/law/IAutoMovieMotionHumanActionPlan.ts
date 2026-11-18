import type { IAutoMovieHumanoidSurfaces } from "../../../pose/IAutoMovieHumanoidSurfaces";
import type { IAutoMoviePose } from "../../../pose/IAutoMoviePose";
import type { IAutoMoviePoseResolution } from "../../../pose/IAutoMoviePoseResolution";
import type { IAutoMovieMotionEvent } from "../../IAutoMovieMotionEvent";
import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import type { AutoMovieMotionHumanChannelClaim } from "../compose/AutoMovieMotionHumanChannelClaim";
import type { IAutoMovieHumanPostureRotation } from "../posture/IAutoMovieHumanPostureRotation";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanBase } from "./IAutoMovieMotionHumanBase";
import type { IAutoMovieMotionHumanBalance } from "./IAutoMovieMotionHumanBalance";
import type { IAutoMovieMotionHumanContactWindow } from "./IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionHumanFlight } from "./IAutoMovieMotionHumanFlight";
import type { IAutoMovieMotionPropDrive } from "./IAutoMovieMotionPropDrive";
import type { IAutoMovieMotionPropHold } from "./IAutoMovieMotionPropHold";
import type { IAutoMovieMotionPropLaunch } from "./IAutoMovieMotionPropLaunch";
import type { IAutoMovieMotionPropMount } from "./IAutoMovieMotionPropMount";
import type { IAutoMovieMotionPropWear } from "./IAutoMovieMotionPropWear";
import type { IAutoMovieMotionWeaponContact } from "./IAutoMovieMotionWeaponContact";
import type { IAutoMovieMotionWeaponPath } from "./IAutoMovieMotionWeaponPath";
import type { IAutoMovieMotionWieldedTool } from "./IAutoMovieMotionWieldedTool";

/**
 * One planned instance of an action: its duration in seconds, its named events and contact windows as shares of that duration, its decisive instant, and its posture as a pure function of the seconds since the action's start.
 *
 * The plan is computed once per instance and carries whatever the law decided (footprints, a flight parabola, a strike path), so every frame is a closed evaluation of `posture`, independent of the frame grid.
 *
 * @evidence contracts/development/common.md#meaningful-documentation duration: Duration, seconds; positive. events: Named instants, shares of the duration. contacts: Contact windows, shares of the duration. from: Share of this action from which the prop is held. from: Share of this action from which the prop is worn. from: Share of this action from which the prop rides the socket.
 * @evidence contracts/development/design.md#principled-representation duration: Duration, seconds; positive. events: Named instants, shares of the duration. contacts: Contact windows, shares of the duration. from: Share of this action from which the prop is held. from: Share of this action from which the prop is worn. from: Share of this action from which the prop rides the socket.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/jump.ts (jump.plan, return); actions/run.ts (run.plan, return); actions/stand.ts (stand.plan, return); actions/support.ts (support.plan, return); actions/walk.ts (walk.plan, return); actions/walk.ts (walk.locomote, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionEvent, IAutoMovieMotionHumanContactWindow, AutoMovieMotionHumanChannelClaim, IAutoMovieMotionHumanBase, IAutoMovieMotionHumanPosture, IAutoMovieHumanoidSurfaces.ITangent identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. Shares the canonical AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export interface IAutoMovieMotionHumanActionPlan {
  /** Duration, seconds; positive. */
  duration: number;

  /** Named instants, shares of the duration. */
  events: IAutoMovieMotionEvent[];

  /** Contact windows, shares of the duration. */
  contacts: IAutoMovieMotionHumanContactWindow[];

  /** The balance window this plan actually uses, or null when its balance is off. */
  balanceWindow?: IAutoMovieMotionHumanBalance.Window;

  /** The part of a physical law that needs physical judgement, in action seconds. */
  physicalWindow?: IAutoMovieMotionHumanActionPlan.IPhysicalWindow;

  /**
   * Seconds since the action's start, from and to, over which `posture`
   * returns one and the same posture, for a plan that holds still there (a
   * stand without sway once it has settled). A reader may treat the body as
   * not moving there; absent, no such window is declared.
   */
  still?: readonly [number, number];

  /**
   * Seconds since the action's start, from and to, over which `posture`
   * keeps its root, its heading, its trunk and both legs' goals and joints
   * one and the same while only the head, the arms or the hands move (a
   * composed action whose primitives write only those, over a base that holds
   * still): every record a leg fit reads is the same there, so a reader may
   * keep the legs' fit of one second for another. Absent, no such window is
   * declared.
   */
  legsStill?: readonly [number, number];

  /**
   * The channels the plan's own movements write, when it is composed of part primitives over a base: what an overlay takes from its carrier. Absent for a plan that writes the whole body.
   */
  channels?: readonly AutoMovieMotionHumanChannelClaim[];

  /**
   * What this instance lets an overlay take, where its parameters decide it apart from its law (`IAutoMovieMotionHumanActionLaw.yields`): a carry in one hand yields its free arm, one in both hands none. The law's when absent.
   */
  yields?: readonly AutoMovieMotionHumanChannelClaim[];

  /**
   * The base the action leaves the body on at its end, declared by an action that changes what carries the body: sitting down declares the seat, kneeling the kneel, rising the stand. Absent for an action that keeps the base it is entered on, which the performance then passes on to the next action unchanged (`IAutoMovieMotionHumanEntryState.base`).
   */
  base?: IAutoMovieMotionHumanBase;

  /**
   * The tool the action works with in a hand: the held prop and which of its affordances are its working point and its edge. Another performer's law that answers this action (a parry of a cut, a flinch from a muzzle) reads the tool here through `IAutoMovieMotionHumanActionContext.action`. Absent for an action performed with the bare body.
   */
  wields?: IAutoMovieMotionWieldedTool;

  /** Seconds from the start to the decisive instant (an impact, a landing, a grip), when the action has one. */
  contact?: number;

  /**
   * Seconds from the start to the contact a feint pretends: the instant its committed twin would land, which an observer who takes the feint for the real action prepares for. Present only on an action that shows a decisive instant it never reaches, so it never accompanies `contact`.
   */
  feigned?: number;

  /**
   * The posture at a second of the action.
   *
   * @param seconds Seconds since the action's start, in [0, duration]; outside, the nearest end.
   * @param channels Optional demand for these channels only. A reader using it inspects only these channels; implementations may still compute the whole posture. Omission requests every channel.
   * @param resolution Optional exact FK source borrowed only for this synchronous unchanged-body evaluation; never retained in the plan, posture, preparation evidence or a returned callback.
   * @param projection Optional genuine same-body ROM projector borrowed for this call only; every actual direct joint is still projected, and unknown functions fall back to ordinary admission.
   * @returns The borrowed posture; when a demand is supplied, only requested channels are guaranteed current.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionPlan.posture: The posture at a second of the action.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionPlan.posture is used through packages/motions/src/perform/HumanSegment.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionPlan.posture is used through packages/motions/src/perform/HumanSegment.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionPlan.posture is used through packages/motions/src/perform/HumanSegment.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionPlan.posture is used through packages/motions/src/perform/HumanSegment.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionPlan.posture is used through packages/motions/src/perform/HumanSegment.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionPlan.posture is used through packages/motions/src/perform/HumanSegment.ts.
   */
  posture(
    seconds: number,
    channels?: readonly AutoMovieMotionHumanChannel[],
    resolution?: IAutoMoviePoseResolution.ISource,
    projection?: (pose: IAutoMoviePose) => IAutoMoviePose,
  ): IAutoMovieMotionHumanPosture;

  /**
   * Drop anything memoised from reads made before the performance settled. A plan whose geometry depends on another person or prop may build it on its first posture call; a call during schedule resolution can read a half-placed performance, so the performance calls this on every plan once every action is placed, before any pose is evaluated again.
   * `contacts` may be a getter over the same memo.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionPlan.settle: Drop anything memoised from reads made before the performance settled. A plan whose geometry depends on another person or prop may build it on its first posture call; a call during schedule resolution can read a half-placed performance, so the performance calls this on every plan once every action is placed, before any pose is evaluated again. `contacts` may be a getter over the same memo.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionPlan.settle is used through packages/motions/src/perform/HumanSegment.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionPlan.settle is used through packages/motions/src/perform/HumanSegment.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionPlan.settle is used through packages/motions/src/perform/HumanSegment.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionPlan.settle is used through packages/motions/src/perform/HumanSegment.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionPlan.settle is used through packages/motions/src/perform/HumanSegment.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionPlan.settle is used through packages/motions/src/perform/HumanSegment.ts.
   */
  settle?(): void;

  /**
   * Props this action leaves held: each persists into the performer's later actions until one of them declares its own grip window on that hand for that prop (a put-down, a hand-over, a drink), which takes the hand over. While a hold persists and the active action does not drive that hand, the performance carries the hand with the trunk and keeps its fingers, and the prop rides the hand.
   */
  holds?: readonly IAutoMovieMotionPropHold[];

  /**
   * Props this action puts on the performer's body: from its instant the prop rides the named bone with the offset it has there, as a worn hat, holster or watch does, until a later grip takes it off (`IAutoMovieMotionHumanProp.worn`).
   */
  wears?: readonly IAutoMovieMotionPropWear[];

  /**
   * Props this action sets on another prop's socket: an arrow nocked on a bow's string. From its instant the prop rides that socket, posed where the other prop's articulations put it at every second (the arrow drawn with the string), until a later grip takes it off: a prop parented to a socket in the scene graph, as a worn prop is to a bone.
   */
  mounts?: readonly IAutoMovieMotionPropMount[];

  /**
   * Articulations of props this action moves: a door's hinge the hand swings, a trigger it presses, a slider it draws. Each writes the travel of one articulation over a window of the action; the performance poses the prop by them (`HumanPerformance.state`), and after a drive ends its last travel holds. A drive writes travel only, never the prop's frame.
   */
  drives?: readonly IAutoMovieMotionPropDrive[];

  /**
   * Props this action sets flying: a thrown bottle at the hand's opening, an arrow at the loose, a ball at the trigger's break. From its second the prop leaves every grip and flies from the launch's point and velocity until its flight ends (`HumanPerformance.flights`).
   */
  launches?: readonly IAutoMovieMotionPropLaunch[];

  /**
   * Hands this action drives with no contact window, such as a wave or a point. A hand with a contact window is driven anyway. An action that drives a held hand without taking its prop over is refused.
   */
  hands?: readonly ("left" | "right")[];

  /**
   * Striking surfaces this action moves on free paths, for the performance's simultaneous-contact resolution: every active weapon of every person is stopped at its first contact with another person's colliders, in time order, each later weapon seeing the earlier stops (`resolveAutoMovieContactEvents`).
   */
  weapons?: readonly IAutoMovieMotionWeaponPath[];

  /**
   * Receive this action's resolved contacts, once, after the schedule is placed and before any pose is shown; a law that takes them replaces its own contact scan. A stop changes the pose only, never the duration, the events or the decisive instant.
   *
   * @param events This action's weapons' first contacts, in time order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionPlan.stop: Receive this action's resolved contacts, once, after the schedule is placed and before any pose is shown; a law that takes them replaces its own contact scan. A stop changes the pose only, never the duration, the events or the decisive instant.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionPlan.stop is used through packages/motions/src/perform/HumanPerformanceContacts.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionPlan.stop is used through packages/motions/src/perform/HumanPerformanceContacts.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionPlan.stop is used through packages/motions/src/perform/HumanPerformanceContacts.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionPlan.stop is used through packages/motions/src/perform/HumanPerformanceContacts.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionPlan.stop is used through packages/motions/src/perform/HumanPerformanceContacts.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionPlan.stop is used through packages/motions/src/perform/HumanPerformanceContacts.ts.
   */
  stop?(events: readonly IAutoMovieMotionWeaponContact[]): void;

  /**
   * Where within its target region a strike is aimed, as an offset from the region's own point on the region's tangent plane, when this repeat of the strike varies. The striker's aim, the defence that answers it and the strike's record all read this one value, so they agree on the point. Absent, the strike is aimed at the region's own point.
   */
  aimed?: IAutoMovieHumanoidSurfaces.ITangent;

  /**
   * The span in which the body flies, touching nothing, and the angular momentum it flies with (#3427). The performance turns the composed body through it after placement (`HumanPerformanceFlight`): the shape the carrier, its overlays and its layers give, integrated by conserved angular momentum, handed back through `airborne`. Absent for an action with no flight, or one whose flight does not turn.
   */
  flight?: IAutoMovieMotionHumanFlight;

  /**
   * Receive the flight's whole-body rotation, once, after placement and the contacts and before any pose is shown, like `stop`: between take-off and touchdown the plan then returns its posture with that `rotation` (`IAutoMovieMotionHumanPosture.rotation`). It changes the pose only, never the duration, the events or the decisive instant.
   *
   * @param rotation The rotation at a second of this action, seconds since its start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionPlan.airborne: Receive the flight's whole-body rotation, once, after placement and the contacts and before any pose is shown, like `stop`: between take-off and touchdown the plan then returns its posture with that `rotation` (`IAutoMovieMotionHumanPosture.rotation`). It changes the pose only, never the duration, the events or the decisive instant.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionPlan.airborne is used through packages/motions/src/perform/HumanPerformanceFlight.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionPlan.airborne is used through packages/motions/src/perform/HumanPerformanceFlight.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionPlan.airborne is used through packages/motions/src/perform/HumanPerformanceFlight.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionPlan.airborne is used through packages/motions/src/perform/HumanPerformanceFlight.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionPlan.airborne is used through packages/motions/src/perform/HumanPerformanceFlight.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionPlan.airborne is used through packages/motions/src/perform/HumanPerformanceFlight.ts.
   */
  airborne?(
    rotation: (seconds: number) => IAutoMovieHumanPostureRotation,
  ): void;
}

/** Prepared terms shared by an action plan and its readers. */
export namespace IAutoMovieMotionHumanActionPlan {
  /**
   * The closed physical phase on the plan's own clock, in seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the clock, unit and endpoint rule.
   * @evidence contracts/development/design.md#principled-representation The two event times delimit the part of an action whose outcome requires physical judgement.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Shared by the law that places the phase and the motion audit that judges it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The phase is declared explicitly by its producer without inferring it from poses.
   */
  export interface IPhysicalWindow {
    /** Seconds from the action start to the beginning of the physical phase. */
    from: number;

    /** Seconds from the action start to the end of the physical phase. */
    to: number;
  }
}
