import type {
  IAutoMovieProjectile,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { HumanBase } from "./HumanBase";
import type { IHumanContactWindow } from "./IHumanContactWindow";

/**
 * One planned instance of an action: its duration in seconds, its named
 * events and contact windows as shares of that duration, its decisive
 * instant, and its posture as a pure function of the seconds since the
 * action's start.
 *
 * The plan is computed once per instance and carries whatever the law decided
 * (footprints, a flight parabola, a strike path), so every frame is a closed
 * evaluation of `posture`, independent of the frame grid.
 */
export interface IHumanActionPlan {
  /** Duration, seconds; positive. */
  duration: number;

  /** Named instants, shares of the duration. */
  events: IAutoMovieMotionEvent[];

  /** Contact windows, shares of the duration. */
  contacts: IHumanContactWindow[];

  /**
   * The channels the plan's own movements write, when it is composed of part
   * primitives over a base: what an overlay takes from its carrier. Absent
   * for a plan that writes the whole body.
   */
  channels?: readonly AutoMovieMotionHumanChannel.Claim[];

  /**
   * The base the action leaves the body on at its end, declared by an
   * action that changes what carries the body: sitting down declares the
   * seat, kneeling the kneel, rising the stand. Absent for an action that
   * keeps the base it is entered on, which the performance then passes on
   * to the next action unchanged (`IHumanEntryState.base`).
   */
  base?: HumanBase;

  /**
   * The tool the action works with in a hand: the held prop and which of
   * its affordances are its working point and its edge. Another performer's
   * law that answers this action (a parry of a cut, a flinch from a muzzle)
   * reads the tool here through `IHumanActionContext.action`. Absent for an
   * action performed with the bare body.
   */
  wields?: IHumanActionPlan.ITool;

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
  posture(seconds: number): IHumanPosture;

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
  holds?: readonly IHumanActionPlan.IHold[];

  /**
   * Props this action puts on the performer's body: from its instant the
   * prop rides the named bone with the offset it has there, as a worn hat,
   * holster or watch does, until a later grip takes it off
   * (`IHumanProp.worn`).
   */
  wears?: readonly IHumanActionPlan.IWear[];

  /**
   * Articulations of props this action moves: a door's hinge the hand
   * swings, a trigger it presses, a slider it draws. Each writes the travel
   * of one articulation over a window of the action; the performance poses
   * the prop by them (`HumanPerformance.state`), and after a drive ends its
   * last travel holds. A drive writes travel only, never the prop's frame.
   */
  drives?: readonly IHumanActionPlan.IDrive[];

  /**
   * Props this action sets flying: a thrown bottle at the hand's opening, an
   * arrow at the loose, a ball at the trigger's break. From its second the
   * prop leaves every grip and flies from the launch's point and velocity
   * until its flight ends (`HumanPerformance.flights`).
   */
  launches?: readonly IHumanActionPlan.ILaunch[];

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
  weapons?: readonly IHumanActionPlan.IWeapon[];

  /**
   * Receive this action's resolved contacts, once, after the schedule is
   * placed and before any pose is shown; a law that takes them replaces its
   * own contact scan. A stop changes the pose only, never the duration, the
   * events or the decisive instant.
   *
   * @param events This action's weapons' first contacts, in time order.
   */
  stop?(events: readonly IHumanActionPlan.IContactEvent[]): void;

  /**
   * Where within its target region a strike is aimed, as an offset from the
   * region's own point on the region's tangent plane, when this repeat of
   * the strike varies. The striker's aim, the defence that answers it and the
   * strike's record all read this one value, so they agree on the point.
   * Absent, the strike is aimed at the region's own point.
   */
  aimed?: resolveAutoMovieHumanoidSurfaces.ITangent;

  /**
   * The span in which the body flies, touching nothing, and the angular
   * momentum it flies with (#3427). The performance turns the composed body
   * through it after placement (`HumanPerformanceFlight`): the shape the
   * carrier, its overlays and its layers give, integrated by conserved
   * angular momentum, handed back through `airborne`. Absent for an action
   * with no flight, or one whose flight does not turn.
   */
  flight?: IHumanActionPlan.IFlight;

  /**
   * Receive the flight's whole-body rotation, once, after placement and the
   * contacts and before any pose is shown, like `stop`: between take-off and
   * touchdown the plan then returns its posture with that `rotation`
   * (`IHumanPosture.rotation`). It changes the pose only, never the
   * duration, the events or the decisive instant.
   *
   * @param rotation The rotation at a second of this action, seconds since its start.
   */
  airborne?(rotation: (seconds: number) => IHumanPosture.IRotation): void;
}
/**
 * Companion types of {@link IHumanActionPlan}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's unit.
 * @evidence contracts/development/design.md#principled-representation A held prop by hand, share and finger angles.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the performance needs to carry a prop across actions.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses clinical joint triples.
 */
export namespace IHumanActionPlan {
  /** A flight: its span and the angular momentum it turns by. */
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
    momentum: IFlightMomentum | IFlightTurns;
  }

  /** A flight's momentum given outright. */
  export interface IFlightMomentum {
    /** The discriminator. */
    kind: "momentum";

    /** World kg m²/s about the centre of mass. */
    momentum: IAutoMovieVector3;
  }

  /** A flight's momentum solved from the turns it must make. */
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

  /** A striking surface on its free path. */
  export interface IWeapon {
    /** Id, unique within the plan. */
    id: string;

    /** The limb that carries it; frozen at its stop while contacts resolve. */
    limb: IHumanPosture.Limb;

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

  /** A resolved first contact. */
  export interface IContactEvent {
    /** The weapon's id within its plan. */
    weapon: string;

    /** The person it met. */
    against: string;

    /** Film second of contact. */
    seconds: number;
  }

  /** A held prop an action works with. */
  export interface ITool {
    /** The prop's subject id. */
    prop: string;

    /** The holding hand. */
    side: HumanHand.Side;

    /** The affordance id of its working point: a blade's point, a muzzle, a hammer's face. */
    tip: string;

    /** The affordance id of its edge or sighting direction, where it has one. */
    edge?: string;
  }

  /** A prop put on one of the performer's bones. */
  export interface IWear {
    /** The prop's subject. */
    prop: string;

    /** The bone it rides. */
    bone: AutoMovieHumanoidBone;

    /** Share of this action from which the prop is worn. */
    from: number;
  }

  /** An articulation of a prop driven by the action. */
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

  /** A prop launched by the action. */
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

  /** A prop left held in one hand. */
  export interface IHold {
    /** The holding hand. */
    side: HumanHand.Side;

    /** The prop's subject. */
    prop: string;

    /** Share of this action from which the prop is held. */
    from: number;

    /** The holding fingers' clinical angles, kept while carried. */
    fingers?: Readonly<
      Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
    >;
  }
}
