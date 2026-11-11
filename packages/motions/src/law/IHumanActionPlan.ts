import type { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanPosture } from "../posture/IHumanPosture";
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
  /** A striking surface on its free path. */
  export interface IWeapon {
    /** Id, unique within the plan. */
    id: string;

    /** The limb that carries it; frozen at its stop while contacts resolve. */
    limb: "leftArm" | "rightArm" | "leftLeg" | "rightLeg";

    /** Radius of the striking sphere, metres. */
    radius: number;

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

  /** A prop left held in one hand. */
  export interface IHold {
    /** The holding hand. */
    side: "left" | "right";

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
