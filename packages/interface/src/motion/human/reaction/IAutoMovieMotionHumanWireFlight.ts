import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * A body flown on wires along an authored path that ignores gravity: a
 * superhero's flight, a wuxia leap, a levitation (wire work in Hong Kong
 * action cinema, David Bordwell, Planet Hong Kong, 2nd ed., 2011).
 *
 * The root travels from where the action starts through `via` to `to`,
 * straight between the points, on one minimum-jerk profile over `seconds`,
 * so it leaves and arrives at rest and joins a stand at either end without
 * a jump in velocity. The body holds its flight shape: `superman`
 * horizontal and face down along the travel, `hover` upright, `seated` with
 * the hips and knees folded, `stride` in a running stride in the air. It
 * faces along its horizontal travel. The path carries no gravity check.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the path, its profile, the shapes, the heading and the absent gravity check, with the source.
 * @evidence contracts/development/design.md#principled-representation World points in metres, seconds and a closed shape union; the law refuses a non-positive time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters the registered `wireFlight` law reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The path is the author's; nothing is fitted to it.
 */
export namespace IAutoMovieMotionHumanWireFlight {
  /** The body's shape in the air. */
  export type Shape = "superman" | "hover" | "seated" | "stride" | "limp";

  /** A hand or a foot that touches a surface in the air. */
  export type Part = "leftHand" | "rightHand" | "leftFoot" | "rightFoot";

  /**
   * Parameters.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns refusals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame, unit and default.
   * @evidence contracts/development/design.md#principled-representation World root points in metres and seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `wireFlight.plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every member has one meaning in every shape.
   */
  export interface IParams {
    /** Where the root ends, world metres: its height above the floor included. */
    to: IAutoMovieVector3;

    /** Points the root passes on the way, world metres; none when absent. */
    via?: IAutoMovieVector3[];

    /** How long the flight takes, seconds; positive. */
    seconds: number;

    /** The body's shape in the air; `hover` when absent. `limp` is a lifted body whose limbs hang under gravity. */
    shape?: Shape;

    /** Surfaces a hand or a foot meets on the way, as a wuxia runner's foot meets a wall; none when absent. */
    touches?: ITouch[];
  }

  /**
   * One touch of a surface in the air: an ordinary contact with the named
   * surface at a share of the flight.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation A part, a target and a share of the flight.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `wireFlight.plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A touch the part cannot reach from the path is refused.
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
   * An arrested fall: the body falls free from where it stands raised, the
   * wire takes it and stops it above the ground within a bounded
   * deceleration, then lowers it to stand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation Metres, metres per second squared and seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `wireArrest.plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A fall the bound cannot stop above `stop` is refused.
   */
  export interface IArrest {
    /** How far the body falls free before the wire takes it, metres; positive. */
    drop: number;

    /** The root's height above the floor where the wire holds it still, metres; at least zero. */
    stop: number;

    /** The most deceleration the wire applies, metres per second squared; twice standard gravity when absent. */
    deceleration?: number;

    /** How long the wire takes to lower the body to the floor, seconds; 1 when absent. */
    seconds?: number;
  }
}
