import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import type { IAutoMovieHumanoidSurfaces } from "../../../pose/IAutoMovieHumanoidSurfaces";
import type { IAutoMovieMotionEvent } from "../../IAutoMovieMotionEvent";
import type { IAutoMovieMotionHumanBase } from "./IAutoMovieMotionHumanBase";
import type { IAutoMovieMotionHumanContactWindow } from "./IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieProjectile } from "../../../physics/IAutoMovieProjectile";
import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * One planned instance of an action: its duration in seconds, its named
 * events and contact windows as shares of that duration, its decisive
 * instant, and its posture as a pure function of the seconds since the
 * action's start.
 *
 * The plan is computed once per instance and carries whatever the law decided
 * (footprints, a flight parabola, a strike path), so every frame is a closed
 * evaluation of `posture`, independent of the frame grid.
 *
 * @evidence contracts/development/common.md#meaningful-documentation duration: Duration, seconds; positive. events: Named instants, shares of the duration. contacts: Contact windows, shares of the duration.
 * @evidence contracts/development/design.md#principled-representation duration: Duration, seconds; positive. events: Named instants, shares of the duration. contacts: Contact windows, shares of the duration.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/jump.ts (jump.plan, return); actions/run.ts (run.plan, return); actions/stand.ts (stand.plan, return); actions/support.ts (support.plan, return); actions/walk.ts (walk.plan, return); actions/walk.ts (walk.locomote, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionEvent, IAutoMovieMotionHumanContactWindow, AutoMovieMotionHumanChannel.Claim, IAutoMovieMotionHumanBase, IAutoMovieMotionHumanPosture, IAutoMovieHumanoidSurfaces.ITangent identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export interface IAutoMovieMotionHumanActionPlan {
  /** Duration, seconds; positive. */
  duration: number;

  /** Named instants, shares of the duration. */
  events: IAutoMovieMotionEvent[];

  /** Contact windows, shares of the duration. */
  contacts: IAutoMovieMotionHumanContactWindow[];

  /**
   * The channels the plan's own movements write, when it is composed of part
   * primitives over a base: what an overlay takes from its carrier. Absent
   * for a plan that writes the whole body.
   */
  channels?: readonly AutoMovieMotionHumanChannel.Claim[];

  /**
   * What this instance lets an overlay take, where its parameters decide it
   * apart from its law (`IAutoMovieMotionHumanActionLaw.yields`): a carry in one hand
   * yields its free arm, one in both hands none. The law's when absent.
   */
  yields?: readonly AutoMovieMotionHumanChannel.Claim[];

  /**
   * The base the action leaves the body on at its end, declared by an
   * action that changes what carries the body: sitting down declares the
   * seat, kneeling the kneel, rising the stand. Absent for an action that
   * keeps the base it is entered on, which the performance then passes on
   * to the next action unchanged (`IAutoMovieMotionHumanEntryState.base`).
   */
  base?: IAutoMovieMotionHumanBase;

  /**
   * The tool the action works with in a hand: the held prop and which of
   * its affordances are its working point and its edge. Another performer's
   * law that answers this action (a parry of a cut, a flinch from a muzzle)
   * reads the tool here through `IAutoMovieMotionHumanActionContext.action`. Absent for an
   * action performed with the bare body.
   */
  wields?: IAutoMovieMotionHumanActionPlan.ITool;

  /** Seconds from the start to the decisive instant (an impact, a landing, a grip), when the action has one. */
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
   * @param seconds Seconds since the action's start, in [0, duration]; outside, the nearest end.
   * @returns The posture.
   */
  posture(seconds: number): IAutoMovieMotionHumanPosture;

  /**
   * Drop anything memoised from reads made before the performance settled.
   * A plan whose geometry depends on another person or prop may build it on
   * its first posture call; a call during schedule resolution can read a
   * half-placed performance, so the performance calls this on every plan
   * once every action is placed, before any pose is evaluated again.
   * `contacts` may be a getter over the same memo.
   */
  settle?(): void;

  /**
   * Props this action leaves held: each persists into the performer's later
   * actions until one of them declares its own grip window on that hand for
   * that prop (a put-down, a hand-over, a drink), which takes the hand over.
   * While a hold persists and the active action does not drive that hand, the
   * performance carries the hand with the trunk and keeps its fingers, and
   * the prop rides the hand.
   */
  holds?: readonly IAutoMovieMotionHumanActionPlan.IHold[];

  /**
   * Props this action puts on the performer's body: from its instant the
   * prop rides the named bone with the offset it has there, as a worn hat,
   * holster or watch does, until a later grip takes it off
   * (`IAutoMovieMotionHumanProp.worn`).
   */
  wears?: readonly IAutoMovieMotionHumanActionPlan.IWear[];

  /**
   * Props this action sets on another prop's socket: an arrow nocked on a
   * bow's string. From its instant the prop rides that socket, posed where
   * the other prop's articulations put it at every second (the arrow drawn
   * with the string), until a later grip takes it off: a prop parented to a
   * socket in the scene graph, as a worn prop is to a bone.
   */
  mounts?: readonly IAutoMovieMotionHumanActionPlan.IMount[];

  /**
   * Articulations of props this action moves: a door's hinge the hand
   * swings, a trigger it presses, a slider it draws. Each writes the travel
   * of one articulation over a window of the action; the performance poses
   * the prop by them (`HumanPerformance.state`), and after a drive ends its
   * last travel holds. A drive writes travel only, never the prop's frame.
   */
  drives?: readonly IAutoMovieMotionHumanActionPlan.IDrive[];

  /**
   * Props this action sets flying: a thrown bottle at the hand's opening, an
   * arrow at the loose, a ball at the trigger's break. From its second the
   * prop leaves every grip and flies from the launch's point and velocity
   * until its flight ends (`HumanPerformance.flights`).
   */
  launches?: readonly IAutoMovieMotionHumanActionPlan.ILaunch[];

  /**
   * Hands this action drives with no contact window, such as a wave or a
   * point. A hand with a contact window is driven anyway. An action that
   * drives a held hand without taking its prop over is refused.
   */
  hands?: readonly ("left" | "right")[];

  /**
   * Striking surfaces this action moves on free paths, for the
   * performance's simultaneous-contact resolution: every active weapon of
   * every person is stopped at its first contact with another person's
   * colliders, in time order, each later weapon seeing the earlier stops
   * (`resolveAutoMovieContactEvents`).
   */
  weapons?: readonly IAutoMovieMotionHumanActionPlan.IWeapon[];

  /**
   * Receive this action's resolved contacts, once, after the schedule is
   * placed and before any pose is shown; a law that takes them replaces its
   * own contact scan. A stop changes the pose only, never the duration, the
   * events or the decisive instant.
   *
   * @param events This action's weapons' first contacts, in time order.
   */
  stop?(events: readonly IAutoMovieMotionHumanActionPlan.IContactEvent[]): void;

  /**
   * Where within its target region a strike is aimed, as an offset from the
   * region's own point on the region's tangent plane, when this repeat of
   * the strike varies. The striker's aim, the defence that answers it and the
   * strike's record all read this one value, so they agree on the point.
   * Absent, the strike is aimed at the region's own point.
   */
  aimed?: IAutoMovieHumanoidSurfaces.ITangent;

  /**
   * The span in which the body flies, touching nothing, and the angular
   * momentum it flies with (#3427). The performance turns the composed body
   * through it after placement (`HumanPerformanceFlight`): the shape the
   * carrier, its overlays and its layers give, integrated by conserved
   * angular momentum, handed back through `airborne`. Absent for an action
   * with no flight, or one whose flight does not turn.
   */
  flight?: IAutoMovieMotionHumanActionPlan.IFlight;

  /**
   * Receive the flight's whole-body rotation, once, after placement and the
   * contacts and before any pose is shown, like `stop`: between take-off and
   * touchdown the plan then returns its posture with that `rotation`
   * (`IAutoMovieMotionHumanPosture.rotation`). It changes the pose only, never the
   * duration, the events or the decisive instant.
   *
   * @param rotation The rotation at a second of this action, seconds since its start.
   */
  airborne?(
    rotation: (seconds: number) => IAutoMovieMotionHumanPosture.IRotation,
  ): void;
}

/**
 * Contracts used by jump.plan, run.plan, stand.plan, support.plan.
 *
 * @evidence contracts/development/common.md#meaningful-documentation from: Share of this action from which the prop is held. from: Share of this action from which the prop is worn. from: Share of this action from which the prop rides the socket.
 * @evidence contracts/development/design.md#principled-representation from: Share of this action from which the prop is held. from: Share of this action from which the prop is worn. from: Share of this action from which the prop rides the socket.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/jump.ts (jump.plan, return); actions/run.ts (run.plan, return); actions/stand.ts (stand.plan, return); actions/support.ts (support.plan, return); actions/walk.ts (walk.plan, return); actions/walk.ts (walk.locomote, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanHand.Side, AutoMovieHumanoidBone, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanActionPlan {
  /**
   * A held prop an action works with.
   *
   * @evidence contracts/development/common.md#meaningful-documentation prop: The prop's subject id. side: The holding hand. tip: The affordance id of its working point: a blade's point, a muzzle, a hammer's face.
   * @evidence contracts/development/design.md#principled-representation prop: The prop's subject id. side: The holding hand. tip: The affordance id of its working point: a blade's point, a muzzle, a hammer's face.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Public boundary formerly declared in law/IAutoMovieMotionHumanActionPlan.ts; canonical declarations reference this identity directly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanHand.Side identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ITool {
    /** The prop's subject id. */
    prop: string;

    /** The holding hand. */
    side: IAutoMovieMotionHumanHand.Side;

    /** The affordance id of its working point: a blade's point, a muzzle, a hammer's face. */
    tip: string;

    /** The affordance the working line runs from toward the tip, when two points define it. */
    from?: string;

    /** The affordance id of its edge or sighting direction, where it has one. */
    edge?: string;
  }

  /**
   * The hold the prop is left in when the action ends, with the fingers the hand had closed on it at the entry. A prop left held in one hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation from: Share of this action from which the prop is held.
   * @evidence contracts/development/design.md#principled-representation from: Share of this action from which the prop is held.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanHeld.ts (AutoMovieMotionHumanHeld.hold, return); striking/StrikingHeld.ts (StrikingHeld.holds, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanHand.Side, AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IHold {
    /** The holding hand. */
    side: IAutoMovieMotionHumanHand.Side;

    /** The prop's subject. */
    prop: string;

    /** Share of this action from which the prop is held. */
    from: number;

    /** The holding fingers' clinical angles, kept while carried. */
    fingers?: Readonly<
      Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
    >;
  }

  /**
   * A prop put on one of the performer's bones.
   *
   * @evidence contracts/development/common.md#meaningful-documentation from: Share of this action from which the prop is worn.
   * @evidence contracts/development/design.md#principled-representation from: Share of this action from which the prop is worn.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Public boundary formerly declared in law/IAutoMovieMotionHumanActionPlan.ts; canonical declarations reference this identity directly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IWear {
    /** The prop's subject. */
    prop: string;

    /** The bone it rides. */
    bone: AutoMovieHumanoidBone;

    /** Share of this action from which the prop is worn. */
    from: number;
  }

  /**
   * A prop set on another prop's socket.
   *
   * @evidence contracts/development/common.md#meaningful-documentation from: Share of this action from which the prop rides the socket.
   * @evidence contracts/development/design.md#principled-representation from: Share of this action from which the prop rides the socket.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Public boundary formerly declared in law/IAutoMovieMotionHumanActionPlan.ts; canonical declarations reference this identity directly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in IAutoMovieMotionHumanActionPlan.IMount.
   */
  export interface IMount {
    /** The prop's subject. */
    prop: string;

    /** The prop it is set on. */
    onto: string;

    /** The socket affordance of `onto` it rides. */
    point: string;

    /** Share of this action from which the prop rides the socket. */
    from: number;
  }

  /**
   * An articulation of a prop driven by the action.
   *
   * @evidence contracts/development/common.md#meaningful-documentation from: Share of this action from which it drives. to: Share of this action until which it drives. travel: The articulation's travel at a second of the action, in its own unit (degrees for a turning kind, metres otherwise). Pure.
   * @evidence contracts/development/design.md#principled-representation from: Share of this action from which it drives. to: Share of this action until which it drives. travel: The articulation's travel at a second of the action, in its own unit (degrees for a turning kind, metres otherwise). Pure.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: affordance/operateDrive.ts (operateDrive.drive, return); lexicon/HumanWeaponPresent.ts (HumanWeaponPresent.fire); perform/HumanPerformanceObject.ts (HumanPerformanceObject.writers).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in operateDrive.drive.
   */
  export interface IDrive {
    /** The prop's subject id. */
    prop: string;

    /** The articulation affordance driven. */
    articulation: string;

    /** Share of this action from which it drives. */
    from: number;

    /** Share of this action until which it drives. */
    to: number;

    /**
     * The articulation's travel at a second of the action, in its own unit
     * (degrees for a turning kind, metres otherwise). Pure.
     *
     * @param seconds Seconds since the action's start.
     * @returns The travel.
     */
    travel(seconds: number): number;
  }

  /**
   * A prop launched by the action.
   *
   * @evidence contracts/development/common.md#meaningful-documentation seconds: Seconds from the action's start. point: World metres at launch: where the prop's own origin is. velocity: World metres per second at launch, any carrier's velocity included.
   * @evidence contracts/development/design.md#principled-representation seconds: Seconds from the action's start. point: World metres at launch: where the prop's own origin is. velocity: World metres per second at launch, any carrier's velocity included.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: carrier/HumanSupportCarry.ts (HumanSupportCarry.plan, l); carrier/HumanSupportCarry.ts (HumanSupportCarry.plan, return); carrier/HumanSupportCarry.ts (HumanSupportCarry.launch, l); carrier/HumanSupportCarry.ts (HumanSupportCarry.launch, return); perform/HumanPropFlight.ts (HumanPropFlight.fly, launch); perform/HumanPropSweep.ts (HumanPropSweep.launched, l).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion, IAutoMovieProjectile.Attitude identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ILaunch {
    /** The prop that flies: a held prop the hand lets go, or one the action sets on its way. */
    prop: string;

    /** Seconds from the action's start. */
    seconds: number;

    /** World metres at launch: where the prop's own origin is. */
    point: IAutoMovieVector3;

    /** World metres per second at launch, any carrier's velocity included. */
    velocity: IAutoMovieVector3;

    /** The prop's rotation at launch, prop to world; its displayed rotation then when absent. */
    rotation?: IAutoMovieQuaternion;

    /** How it turns in flight (`IAutoMovieProjectile.attitude`); its launch rotation kept when absent. */
    attitude?: IAutoMovieProjectile.Attitude;
  }

  /**
   * A striking surface on its free path.
   *
   * @evidence contracts/development/common.md#meaningful-documentation radius: Radius of the striking sphere, metres; a capsule's radius at `path`. tailRadius: A tapered capsule's radius at `tail`, metres: the capsule narrows (or widens) linearly from `radius` at `path` to this, as a limb's girth changes from one joint to the next. Absent for a sphere and for a capsule of one radius.
   * @evidence contracts/development/design.md#principled-representation radius: Radius of the striking sphere, metres; a capsule's radius at `path`. tailRadius: A tapered capsule's radius at `tail`, metres: the capsule narrows (or widens) linearly from `radius` at `path` to this, as a limb's girth changes from one joint to the next. Absent for a sphere and for a capsule of one radius.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/composeAutoMovieMotionHumanAction.ts (composeAutoMovieMotionHumanAction.weapons, return); perform/HumanPerformanceContacts.ts (HumanPerformanceContacts.contacts, w); striking/StrikingWeapon.ts (StrikingWeapon.capsules, return); striking/StrikingWeapon.ts (StrikingWeapon.radius, return); compose/composeAutoMovieMotionHumanAction.ts (composeAutoMovieMotionHumanAction); perform/HumanPerformanceContacts.ts (HumanPerformanceContacts.contacts).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanPosture.Limb, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IWeapon {
    /** Id, unique within the plan. */
    id: string;

    /** The limb that carries it; frozen at its stop while contacts resolve. */
    limb: IAutoMovieMotionHumanPosture.Limb;

    /** Radius of the striking sphere, metres; a capsule's radius at `path`. */
    radius: number;

    /**
     * A tapered capsule's radius at `tail`, metres: the capsule narrows (or
     * widens) linearly from `radius` at `path` to this, as a limb's girth
     * changes from one joint to the next. Absent for a sphere and for a
     * capsule of one radius.
     */
    tailRadius?: number;

    /** Film second it becomes live. */
    from: number;

    /** Film second it stops being live. */
    to: number;

    /**
     * The surface's centre on its free path, ignoring its own stop.
     *
     * @param seconds Film seconds.
     * @returns World metres.
     */
    path(seconds: number): IAutoMovieVector3;

    /**
     * The other end of a capsule weapon's axis on its free path, when the
     * weapon is a capsule (a forearm, a shin) rather than a sphere: the weapon
     * is every point of the segment from `path` to `tail` within `radius`.
     *
     * @param seconds Film seconds.
     * @returns World metres.
     */
    tail?(seconds: number): IAutoMovieVector3;
  }

  /**
   * A resolved first contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation weapon: The weapon's id within its plan. against: The person it met. seconds: Film second of contact.
   * @evidence contracts/development/design.md#principled-representation weapon: The weapon's id within its plan. against: The person it met. seconds: Film second of contact.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/composeAutoMovieMotionHumanAction.ts (composeAutoMovieMotionHumanAction, events); striking/kick.ts (kick.plan, found); striking/knee.ts (knee.plan.out, found); striking/punch.ts (punch.plan.out, found); striking/StrikingWeapon.ts (StrikingWeapon.first, events); striking/StrikingWeapon.ts (StrikingWeapon.first, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in composeAutoMovieMotionHumanAction.
   */
  export interface IContactEvent {
    /** The weapon's id within its plan. */
    weapon: string;

    /** The person it met. */
    against: string;

    /** Film second of contact. */
    seconds: number;
  }

  /**
   * A flight: its span and the angular momentum it turns by.
   *
   * @evidence contracts/development/common.md#meaningful-documentation from: Take-off, a share of the action's duration. to: Touchdown, a share of the action's duration, after `from`.
   * @evidence contracts/development/design.md#principled-representation from: Take-off, a share of the action's duration. to: Touchdown, a share of the action's duration, after `from`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceFlight.ts (HumanPerformanceFlight.flight).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanActionPlan.IFlightMomentum, IAutoMovieMotionHumanActionPlan.IFlightTurns identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IFlight {
    /** Take-off, a share of the action's duration. */
    from: number;

    /** Touchdown, a share of the action's duration, after `from`. */
    to: number;

    /**
     * The whole-body angular momentum about the centre of mass: given, world
     * kg m²/s, or solved from the turns the flight must make
     * (`solveAirborneTakeoff`).
     */
    momentum:
      | IAutoMovieMotionHumanActionPlan.IFlightMomentum
      | IAutoMovieMotionHumanActionPlan.IFlightTurns;
  }

  /**
   * A flight's momentum given outright.
   *
   * @evidence contracts/development/common.md#meaningful-documentation kind: The discriminator. momentum: World kg m²/s about the centre of mass.
   * @evidence contracts/development/design.md#principled-representation kind: The discriminator. momentum: World kg m²/s about the centre of mass.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Public boundary formerly declared in law/IAutoMovieMotionHumanActionPlan.ts; canonical declarations reference this identity directly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IFlightMomentum {
    /** The discriminator. */
    kind: "momentum";

    /** World kg m²/s about the centre of mass. */
    momentum: IAutoMovieVector3;
  }

  /**
   * A flight's momentum solved from the turns it must make.
   *
   * @evidence contracts/development/common.md#meaningful-documentation somersault: Somersault turns about the somersault axis, signed (positive tips the head forward). frame: The somersault frame in the root's frame at take-off (a side salto turns it a quarter about the long axis); the root's own axes when absent. maximum: The largest momentum the take-off can give, kg m²/s; when absent, the flight pass derives it from the take-off's own momentum and the centre's lever over the foot (`HumanPerformanceFlight`).
   * @evidence contracts/development/design.md#principled-representation somersault: Somersault turns about the somersault axis, signed (positive tips the head forward). frame: The somersault frame in the root's frame at take-off (a side salto turns it a quarter about the long axis); the root's own axes when absent. maximum: The largest momentum the take-off can give, kg m²/s; when absent, the flight pass derives it from the take-off's own momentum and the centre's lever over the foot (`HumanPerformanceFlight`).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceFlight.ts (HumanPerformanceFlight.flight).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IFlightTurns {
    /** The discriminator. */
    kind: "turns";

    /** Somersault turns about the somersault axis, signed (positive tips the head forward). */
    somersault: number;

    /** Twist turns about the long axis, signed by the right-hand rule about the body's up. */
    twist: number;

    /** The somersault frame in the root's frame at take-off (a side salto turns it a quarter about the long axis); the root's own axes when absent. */
    frame?: IAutoMovieQuaternion;

    /** The largest momentum the take-off can give, kg m²/s; when absent, the flight pass derives it from the take-off's own momentum and the centre's lever over the foot (`HumanPerformanceFlight`). */
    maximum?: number;
  }
}
