import { AutoMovieMotionHumanAuditTangle } from "../audit/AutoMovieMotionHumanAuditTangle";
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

  /** Weight of a squared degree of the hand's rotation off its site, on a hold waypoint. */
  export const ROTATION: number = 10;

  /** Weight of a squared millimetre of an elbow's or a wrist's step. */
  export const LENGTH: number = 0.01;

  /** The probes whose Cartesian steps the objective sums: the elbow and the wrist. */
  export const PATH: readonly number[] = [G.ELBOW, G.WRIST];

  /** The probes whose speed is bounded: the elbow, the wrist and the fingertips. */
  export const SPEED: readonly number[] = [G.ELBOW, G.WRIST, G.TIP];

  /** How much deeper than the rest arm a probe may lie in a shape, metres: half the skin the tangle audit allows. */
  export const DEPTH: number = AutoMovieMotionHumanAuditTangle.BUILT / 2;

  /** The slack a clearance miss has before the path is refused, millimetres, over the solver's own `TOLERANCE`: a probe is refused exactly where the tangle audit's skin (`BUILT`) is passed, the allowance's margin (`DEPTH`) aside. */
  export const SKIN: number = 1000 * (AutoMovieMotionHumanAuditTangle.BUILT - DEPTH) - TOLERANCE;

  /** TrajOpt's active set: a pair enters the convex subproblem only within this of its bound, millimetres. */
  export const CHECK: number = 20;

  /** The reach within which a shape is read against a probe, metres. */
  export const REACH: number = 0.05;

  /** Weight of a squared millimetre the hand stands off its site along the normal: the lift is the least that clears. */
  export const LIFT: number = 10;

  /** Weight of a squared millimetre the contact lands from its site along the surface. */
  export const SITE: number = 10;
}
