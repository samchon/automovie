import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Lie on a raised support (#3987): from sitting on a bed's or a sofa's long
 * edge, lower the trunk onto the side toward the head end while the legs
 * swing up, then roll onto the back; or, with `rise`, the reverse from lying
 * to sitting on the edge.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the route each way and every member's meaning.
 * @evidence contracts/development/design.md#principled-representation The support is a prop's named lying surface and edge seat; the position is one of the lying ones.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The support, the edge, the position, the direction, the hold and the manner the bedroom scenes use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A surface too short or narrow for the body, or an entry not seated on the edge, is refused at runtime with the dimension.
 */
export interface IAutoMovieMotionHumanLieOnSurface {
  /** The bed or sofa prop. */
  prop: string;

  /** The prop's lying surface: a `surface` affordance whose depth runs along `+Z` with the head at `-Z`; `surface` when absent. */
  surface?: string;

  /** The edge seat sat on or risen to: `leftSide` or `rightSide`. */
  edge: string;

  /** The lying position reached, or left when rising; `supine` when absent. */
  position?: IAutoMovieMotionHumanLieOnSurface.Position;

  /** Sit up from lying onto the edge instead of lying down from it. */
  rise?: boolean;

  /** How long the end posture is held, seconds; none when absent. */
  hold?: number;

  /** How the body goes down or comes up. */
  manner?: IAutoMovieMotionManner;
}

/**
 * Companion types of {@link IAutoMovieMotionHumanLieOnSurface}.
 */
export namespace IAutoMovieMotionHumanLieOnSurface {
  /** The lying positions on the surface: on the back, or on the side that turns toward the head end from the edge. */
  export type Position = "supine" | "lateral";
}
