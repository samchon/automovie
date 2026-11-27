import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";

/**
 * Lie on a raised support: from sitting on a bed's or a sofa's long edge, lower
 * the trunk onto the side toward the head end while the legs swing up, then
 * roll onto the back; or, with `rise`, the reverse from lying to sitting on the
 * edge.
 */
export interface IAutoMovieMotionHumanLieOnSurface {
  /** The bed or sofa prop. */
  prop: string;

  /**
   * The prop's lying surface: a `surface` affordance whose depth runs along
   * `+Z` with the head at `-Z`; `surface` when absent.
   */
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

/** Companion types of {@link IAutoMovieMotionHumanLieOnSurface}. */
export namespace IAutoMovieMotionHumanLieOnSurface {
  /**
   * The lying positions on the surface: on the back, or on the side that turns
   * toward the head end from the edge.
   */
  export type Position = "supine" | "lateral";
}
