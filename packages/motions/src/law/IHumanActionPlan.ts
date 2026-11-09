import type { IAutoMovieMotionEvent } from "@automovie/interface";

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
}
