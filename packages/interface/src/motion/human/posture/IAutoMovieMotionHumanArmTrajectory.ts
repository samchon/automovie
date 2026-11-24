import type { IAutoMovieMotionHumanArmClearance } from "./IAutoMovieMotionHumanArmClearance";
import type { IAutoMovieMotionHumanPosture } from "./IAutoMovieMotionHumanPosture";

/**
 * A performer's arms over one action as one trajectory optimisation, in
 * TrajOpt's formulation (Schulman et al. 2014, "Motion planning with sequential
 * convex optimization and convex collision checking", IJRR 33:1251): the arms'
 * joint-space waypoints over the reach, the hold and the return are the
 * variables, the objective and the constraints are `HumanArmTrajectoryModel`'s,
 * and the problem is solved by penalty sequential convex optimisation with a
 * trust region (TrajOpt's Algorithm 1, `HumanArmOptimiser`) from a seed whose
 * hold is solved by inverse kinematics and whose reach and return are a
 * sampling planner's clear paths (`HumanArmSeed`), its waypoints refined where
 * they do not bound what lies between them (`HumanArmRefine`). Two arms that
 * move over one span are one problem, their probes kept clear of each other as
 * they both move: planning one after the other is incomplete where their paths
 * are coupled (Erdmann and Lozano-Pérez 1987, Algorithmica 2:477). A problem
 * whose first arm is the left is solved as its mirror image, the arms on the
 * other side, so mirrored scenes give mirrored paths. A problem still
 * infeasible at the last penalty is refused.
 */
export namespace IAutoMovieMotionHumanArmTrajectory {
  /** An arm at any second of the span. */
  export type Trajectory = (
    seconds: number,
  ) => IAutoMovieMotionHumanArmClearance.IArm;

  /**
   * A planned arm at a second as its plan plays it: the arm's joints and its
   * hand's finger state in joint space, the state the planner read the hand by.
   * The display writes both unchanged and fits no digit after the plan, as
   * MoveIt's grasp carries its finger state (`moveit_msgs/Grasp`,
   * `grasp_posture`) for execution to play.
   */
  export interface IPlayed extends IAutoMovieMotionHumanArmClearance.IArm {
    /**
     * The hand's digit joints, clinical flexion, abduction and twist in
     * degrees, by bone; a digit the plan carries no state for is absent.
     */
    digits: IAutoMovieMotionHumanPosture["joints"];
  }

  /**
   * A planned arm and its hand's finger state at any second of the span, as its
   * plan plays them (`IPlayed`).
   */
  export type Played = (seconds: number) => IPlayed;

  /**
   * A solved trajectory as plan data: what a later solve of the same action (a
   * replan at another start or over a longer span) starts from.
   */
  export interface IState {
    /** The knots' seconds, ascending. */
    times: readonly number[];

    /**
     * Each arm's coordinates at each knot, in the solved problem's own order
     * and mirror image.
     */
    x: readonly (readonly (readonly number[])[])[];

    /** The penalty the solution was reached at. */
    penalty: number;
  }
}
