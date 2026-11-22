import { AutoMovieMotionHumanAuditSkin } from "../audit/AutoMovieMotionHumanAuditSkin";
import { HumanArmGeometry as G } from "./HumanArmGeometry";

/**
 * The weights and bounds of an arms' trajectory (`HumanArmTrajectoryModel`),
 * which its evaluation and its convex model read alike.
 */
export namespace HumanArmTrajectoryTerms {
  /** The largest violation of a constraint other than clearance accepted as feasible: a millimetre, or a millimetre per step; the solve refuses past it. */
  export const TOLERANCE: number = 1;

  /** Weight of a squared coordinate acceleration per waypoint. */
  export const ACCELERATION: number = 10;

  /** Weight of a squared coordinate unit a still configuration lies from its anchor: an acceleration's own, so a coordinate moved off the anchor costs what the same second difference does. */
  export const ANCHOR: number = ACCELERATION;

  /** Weight of a squared degree of the hand's rotation off its site, on a hold waypoint. */
  export const ROTATION: number = 10;

  /** Weight of a squared millimetre of an elbow's or a wrist's step. */
  export const LENGTH: number = 0.01;

  /** The probes whose Cartesian steps the objective sums: the elbow and the wrist. */
  export const PATH: readonly number[] = [G.ELBOW, G.WRIST];

  /** The probes whose speed is bounded: the elbow, the wrist and the fingertips. */
  export const SPEED: readonly number[] = [G.ELBOW, G.WRIST, G.TIP];

  /** How much deeper than the rest arm a probe may lie in a shape, metres: half the skin the tangle audit allows. */
  export const DEPTH: number = AutoMovieMotionHumanAuditSkin.BUILT / 2;

  /**
   * The slack a clearance miss has before the path is refused, millimetres,
   * over the solver's own `TOLERANCE`: none, so a probe is admitted and
   * refused against its allowance, `DEPTH` below the tangle audit's skin
   * (`BUILT`). The displayed take is the planned arm on the body as the
   * display moves it (its layers and the audit's own grid), so the course
   * keeps that margin for it; a course admitted up to the skin itself would
   * show past the audit's bound.
   */
  export const SKIN: number = 0;

  /** TrajOpt's active set: a pair enters the convex subproblem only within this of its bound, millimetres. */
  export const CHECK: number = 20;

  /** The reach within which a shape is read against a probe, metres. */
  export const REACH: number = 0.05;

  /** Weight of a squared millimetre the hand stands off its site along the normal: the lift is the least that clears. */
  export const LIFT: number = 10;

  /** Weight of a squared millimetre the contact lands from its site along the surface. */
  export const SITE: number = 10;
}
