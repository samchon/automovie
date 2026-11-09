import type { AutoMovieHumanoidBone, IAutoMovieMotionEvent } from "@automovie/interface";

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
  /** A prop left held in one hand. */
  export interface IHold {
    /** The holding hand. */
    side: "left" | "right";

    /** The prop's subject. */
    prop: string;

    /** Share of this action from which the prop is held. */
    from: number;

    /** The holding fingers' clinical angles, kept while carried. */
    fingers?: Readonly<Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>>;
  }
}
