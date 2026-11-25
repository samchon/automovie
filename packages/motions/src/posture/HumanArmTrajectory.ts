import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmTrajectory,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmTrajectoryLaid } from "./HumanArmTrajectoryLaid";
import { HumanArmTrajectoryMirror as Mirror } from "./HumanArmTrajectoryMirror";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { planHumanArmTrajectory } from "./planHumanArmTrajectory";

/**
 * A performer's arms over one action as one trajectory optimisation, in
 * TrajOpt's formulation (Schulman et al. 2014, "Motion planning with sequential
 * convex optimization and convex collision checking", IJRR 33:1251): the arms'
 * joint-space knots over the reach, the hold and the return are the variables,
 * the objective and the constraints are `HumanArmTrajectoryModel`'s, and the
 * problem is solved by penalty sequential convex optimisation with a trust
 * region (TrajOpt's Algorithm 1, `HumanArmOptimiser`) from a laid course or
 * from a seed whose hold is solved by inverse kinematics and whose reach and
 * return are a sampling planner's clear paths (`HumanArmSeed`). The knots are
 * few, and the trajectory played back between them is admitted by the model's
 * own reading of the knots and of every frame between them, the solve's own
 * last reading (`HumanArmTrajectoryEvaluate`). Two arms that move over one span
 * are one problem, their probes kept clear of each other as they both move:
 * planning one after the other is incomplete where their paths are coupled
 * (Erdmann and Lozano-Perez 1987, Algorithmica 2:477). A problem whose first
 * arm is the left is solved as its mirror image (`HumanArmTrajectoryMirror`),
 * so mirrored scenes give mirrored paths. A problem still infeasible at the
 * last penalty is refused.
 */
export namespace HumanArmTrajectory {
  /** The hand on its site at a hold waypoint (`M.ISite`). */
  export type ISite = M.ISite;

  /** One arm's task. */
  export interface IArm {
    /** The arm. */
    side: AutoMovieHumanSide;
    /** The arm at the first waypoint, and at the last unless `back` is given. */
    rest: IAutoMovieMotionHumanArmClearance.IArm;
    /**
     * The arm at the last waypoint, where it returns to another arm than it
     * left (a gesture that leaves from the entry and returns to the rest);
     * `rest` when absent.
     */
    back?: IAutoMovieMotionHumanArmClearance.IArm;
    /** Its site at each waypoint, on the hold. */
    sites: readonly (ISite | undefined)[];
    /**
     * The arm the goal's own solution gives at the hold's start, where its
     * inverse kinematics starts first (`HumanArmSeed`).
     */
    guess?: IAutoMovieMotionHumanArmClearance.IArm;
    /** Its segments' declared rests over the hold (M.IRest). */
    rests?: readonly M.IRest[];
    /**
     * Its segments that grasp one object with the other arm over the action
     * (`M.IContext.grasped`).
     */
    grasp?: readonly M.Segment[];
  }

  /** One unchanged body and one or two arms on ordered waypoint times. */
  export interface IProblem {
    /** The body. */
    body: IAutoMovieMotionHumanBody;
    /** The waypoints' seconds, in time order. */
    times: readonly number[];
    /**
     * What every arm is read against at each waypoint, the arms of the problem
     * left out.
     */
    bases: readonly G.IBase[];
    /** Native body geometry for the authored hand support, when present. */
    material?: M.IMaterialSource;
    /** An authored interval with fixed self geometry and digit placement. */
    fixedSelf?: M.FixedSelf;
    /** The arms, one or two. */
    arms: readonly IArm[];
    /**
     * The share of the reach made at a second of the reach, and of the return
     * left at a second of the return: 0 at rest, 1 on the hold.
     */
    share: (seconds: number) => number;
  }
  /** A laid course as `admitted` read it (`HumanArmTrajectoryLaid.IAdmitted`). */
  export type IAdmitted = HumanArmTrajectoryLaid.IAdmitted;

  /**
   * A course laid without optimisation and read by the model
   * (`HumanArmTrajectoryLaid.admitted`, which states how it is laid, timed and
   * admitted). The alias transforms no input and adds no state.
   */
  export const admitted: typeof HumanArmTrajectoryLaid.admitted =
    HumanArmTrajectoryLaid.admitted;

  /** The interface contract (`IAutoMovieMotionHumanArmTrajectory.IState`). */
  export type IState = IAutoMovieMotionHumanArmTrajectory.IState;

  /** What `solve` gives: the arms' readers and the state they were read from. */
  export interface ISolved {
    /** Each arm's trajectory, in the problem's order. */
    trajectories: IAutoMovieMotionHumanArmTrajectory.Trajectory[];

    /** The solution, for a later solve of the same action to start from. */
    state: IState;
  }

  /**
   * What a plan tells besides its result: whether it was solved in its mirror
   * image, which `solve` reads to tell a refusal in the author's names, and the
   * solution a refusal for time was reached at, which the caller hands to the
   * plan at the slower time.
   */
  export interface IMirrorTold {
    /** Whether the plan read the mirror image. */
    flip: boolean;

    /**
     * The solution a `duration` refusal was reached at, in the plan's own
     * reading (mirrored where `flip`), as `ISolved.state` holds one: a path the
     * speed bound alone refuses, which the same path over the span the refusal
     * names meets (Hollerbach 1984), so the replan at that span starts from it
     * (`warm`). Absent for any other end.
     */
    state?: IState;
  }

  /**
   * Solve the problem on its knots and admit it on the frame grid.
   *
   * A refused course's hold whose hand pose its law prescribes is tracked frame
   * by frame on the swivel first, and needs no solve. The knots stay few, a
   * moving site held at every frame through their interpolant. The trajectory
   * is then optimised on the knots, its clearance read at the knots and through
   * every frame between them, so its own last reading admits or refuses the
   * path played; only an interval whose course fails between clear knots is
   * split and the path solved again from itself, never to reach a miss at the
   * knots themselves.
   *
   * @param read The problem on given waypoints' seconds.
   * @param times The first knots' seconds, ascending, each taken to the frame
   *   grid's nearest instant: knots are grid instants, so a stretch refined to
   *   the end is bounded at the very instants it is admitted at, and the
   *   admission there is the knots' own evaluation.
   * @param course A laid course the model refused (`admitted`): where its
   *   reading is given, only the stretches about the instants it fails at are
   *   optimised, each once, from the course and between two of its instants
   *   held fixed, the rest of the course kept, and a stretch refused refuses
   *   the span; where the course carries no reading (a stretch cut from one),
   *   the whole span is solved once from it at the knots; the sampling
   *   planner's seed (`HumanArmSeed`) on a grid of thirtieths of a second when
   *   absent.
   * @param warm An earlier solution of this action on this span's seconds
   *   (`ISolved.state`, retimed by the caller where the span changed): tried
   *   first as it stands and returned where the model admits it, and the one
   *   solve's start at its penalty where no course was read. Any state is safe
   *   to give: nothing of it is trusted.
   * @param stretches Whether the span is its law's own, lengthened by a replan
   *   at a slower tempo; a laid course refused only for its speed is then
   *   handed back for the span it needs before any optimisation. False for a
   *   span a meeting fixes.
   * @param told Where the plan tells whether it read the mirror image and, with
   *   a `duration` refusal, the solution it was reached at
   *   (`IMirrorTold.state`); a fresh record when absent.
   * @returns Each arm's trajectory, in the problem's order, and the solution.
   * @throws {HumanRefusal} When no trajectory meets the constraints at its
   *   knots and on the frame grid.
   */
  export function solve(
    read: (times: readonly number[]) => IProblem,
    times: readonly number[],
    course?: IAdmitted,
    warm?: IState,
    stretches: boolean = false,
    told: IMirrorTold = { flip: false },
  ): ISolved {
    // A problem solved in its mirror image refuses in the mirror's names,
    // told here in the author's (`HumanArmTrajectoryMirror.refusal`).
    try {
      return planHumanArmTrajectory(read, times, course, warm, stretches, told);
    } catch (error) {
      if (told.flip && error instanceof HumanRefusal)
        throw Mirror.refusal(error);
      throw error;
    }
  }
}
