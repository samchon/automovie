import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";

/**
 * A body flown on wires along an authored path that ignores gravity: a
 * superhero's flight, a wuxia leap, a levitation (wire work in Hong Kong action
 * cinema, David Bordwell, Planet Hong Kong, 2nd ed., 2011).
 *
 * The root travels from where the action starts through `via` to `to`, straight
 * between the points, on one minimum-jerk profile over `seconds`, so it leaves
 * and arrives at rest and joins a stand at either end without a jump in
 * velocity. The body holds its flight shape: `superman` horizontal and face
 * down along the travel, `hover` upright, `seated` with the hips and knees
 * folded, `stride` in a running stride in the air. It faces along its
 * horizontal travel. The path carries no gravity check.
 */
export namespace IAutoMovieMotionHumanWireFlight {
  /** The body's shape in the air. */
  export type Shape = "superman" | "hover" | "seated" | "stride" | "limp";

  /** A hand or a foot that touches a surface in the air. */
  export type Part = "leftHand" | "rightHand" | "leftFoot" | "rightFoot";

  /** Parameters. */
  export interface IParams {
    /** Where the root ends, world metres: its height above the floor included. */
    to: IAutoMovieVector3;

    /** Points the root passes on the way, world metres; none when absent. */
    via?: IAutoMovieVector3[];

    /**
     * How long the flight takes, seconds; positive. The root keeps one
     * minimum-jerk profile, so its speed peaks at 1.875 times the mean, the
     * path length over this, and starts and ends at rest. A 10 m flight in 4 s
     * averages 2.5 m/s and peaks at 4.7 m/s.
     */
    duration: number;

    /**
     * The body's shape in the air; `hover` when absent. `limp` is a lifted body
     * whose limbs hang under gravity.
     */
    shape?: Shape;

    /**
     * Surfaces a hand or a foot meets on the way, as a wuxia runner's foot
     * meets a wall; none when absent.
     */
    touches?: ITouch[];
  }

  /**
   * One touch of a surface in the air: an ordinary contact with the named
   * surface at a share of the flight.
   */
  export interface ITouch {
    /** The touching hand or foot. */
    part: Part;

    /** The surface point it meets. */
    target: IAutoMovieMotionTarget;

    /** When, as a share of the flight in [0, 1]. */
    at: number;
  }

  /**
   * An arrested fall: the body falls free from where it stands raised, the wire
   * takes it and stops it above the ground within a bounded deceleration, then
   * lowers it to stand.
   */
  export interface IArrest {
    /** How far the body falls free before the wire takes it, metres; positive. */
    drop: number;

    /**
     * The root's height above the floor where the wire holds it still, metres;
     * at least zero.
     */
    stop: number;

    /**
     * The most deceleration the wire applies, metres per second squared; twice
     * standard gravity (19.6 m/s2) when absent.
     */
    deceleration?: number;

    /**
     * How long the wire takes to lower the body to the floor, seconds; 1 when
     * absent.
     */
    duration?: number;
  }
}
