import type {
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
 * TrajOpt's formulation (Schulman et al. 2014, "Motion planning with
 * sequential convex optimization and convex collision checking", IJRR
 * 33:1251): the arms' joint-space knots over the reach, the hold and the
 * return are the variables, the objective and the constraints are
 * `HumanArmTrajectoryModel`'s, and the problem is solved by penalty
 * sequential convex optimisation with a trust region (TrajOpt's Algorithm
 * 1, `HumanArmOptimiser`) from a laid course or from a seed whose hold is
 * solved by inverse kinematics and whose reach and return are a sampling
 * planner's clear paths (`HumanArmSeed`). The knots are few, and the
 * trajectory played back between them is admitted on the frame grid by the
 * model's own evaluation (`HumanArmTrajectoryAdmission`), the knots refined
 * where that reading fails. Two arms that move over one span are one
 * problem, their probes kept clear of each other as they both move:
 * planning one after the other is incomplete where their paths are coupled
 * (Erdmann and Lozano-Perez 1987, Algorithmica 2:477). A problem whose first
 * arm is the left is solved as its mirror image
 * (`HumanArmTrajectoryMirror`), so mirrored scenes give mirrored paths. A
 * problem still infeasible at the last penalty is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the joint-space trajectory, penalty solve, seeds, frame-grid admission and refinement, paired-arm constraints, mirror convention and refusal; solve documents the returned reader's narrower lifetime.
 * @evidence contracts/development/design.md#principled-representation One problem owns the fixed rig, sampled bases/sites and joint-space variables during optimisation; playback needs only the existing setup list, final times and solved coordinates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The site alias, arm/problem inputs, trajectory callback, the laid course's record and the two entries serve ArmPlanned and ArmCourse; the module-private playback factory exposes no optimiser or cache API.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Retains the model's constraints, the mirror rules and the actual optimisation; no sample, tolerance, pose history or alternative solver is substituted.
 */
export namespace HumanArmTrajectory {
  /**
   * The hand on its site at a hold waypoint (`M.ISite`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the existing model-owned site and its hold-waypoint role.
   * @evidence contracts/development/design.md#principled-representation Reuses the model's point, orientation and contact declaration instead of duplicating them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface ArmPlanned produces these sites and the trajectory context/model consume them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias adds no validation, sampled replacement or broader contact guarantee.
   */
  export type ISite = M.ISite;

  /**
   * One arm's task.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States side, first/last rest, waypoint sites, optional IK guess, declared rests and paired grasp.
   * @evidence contracts/development/design.md#principled-representation Keeps one arm's fixed endpoint/contact data beside the existing joint-space rest representation; site order matches the problem times.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The context, seed and model read these fields; no per-query answer or solver history is part of an arm request.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing sites express no hold constraint and absent back reuses rest; no synthetic rig, repaired range or alternate branch is encoded.
   */
  export interface IArm {
    /** The arm. */
    side: "left" | "right";
    /** The arm at the first waypoint, and at the last unless `back` is given. */
    rest: IAutoMovieMotionHumanArmClearance.IArm;
    /** The arm at the last waypoint, where it returns to another arm than it left (a gesture that leaves from the entry and returns to the rest); `rest` when absent. */
    back?: IAutoMovieMotionHumanArmClearance.IArm;
    /** Its site at each waypoint, on the hold. */
    sites: readonly (ISite | undefined)[];
    /** The arm the goal's own solution gives at the hold's start, where its inverse kinematics starts first (`HumanArmSeed`). */
    guess?: IAutoMovieMotionHumanArmClearance.IArm;
    /** Its segments' declared rests over the hold (M.IRest). */
    rests?: readonly M.IRest[];
    /** Its segments that grasp one object with the other arm over the action (`M.IContext.grasped`). */
    grasp?: readonly M.Segment[];
  }

  /**
   * One unchanged body and one or two arms on ordered waypoint times.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the shared body, ordered seconds, corresponding bases and arm sites, and the action-progress callback.
   * @evidence contracts/development/design.md#principled-representation Time-aligned bases/sites and joint variables let the model judge the same composed body and paired contacts at each waypoint.
   * @evidence contracts/development/design.md#minimal-and-owned-surface ArmPlanned builds these inputs for solve, context, model and seed; the returned trajectory contains neither this problem nor its producer callback.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Matching arrays, stable dependencies and the original model's admissibility are caller/solver premises; this record does not certify reach, clearance or a global optimum.
   */
  export interface IProblem {
    /** The body. */
    body: IAutoMovieMotionHumanBody;
    /** The waypoints' seconds, in time order. */
    times: readonly number[];
    /** What every arm is read against at each waypoint, the arms of the problem left out. */
    bases: readonly G.IBase[];
    /** Native body geometry for the authored hand support, when present. */
    material?: M.IMaterialSource;
    /** The arms, one or two. */
    arms: readonly IArm[];
    /**
     * The share of the reach made at a second of the reach, and of the return left at a second of the return: 0 at rest, 1 on the hold.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Names action seconds, the rest/hold endpoints and the caller-provided progress curve that HumanArmSeed reads for its reach/return paths and waypoint seed coordinates.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable field declares the timing input; the caller's clock owns its actual curve and HumanArmSeed owns its use in seed construction.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature has no body; the problem passes this timing callback to HumanArmSeed instead of defining another clock.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The declaration executes no interpolation or repair; the supplied callback must retain the action's timing semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature does no work; callback cost belongs to the provided clock and the actual path/waypoint queries made by HumanArmSeed.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The signature coordinates no evaluation; HumanArmSeed reads the supplied progress at its existing call sites, and playback uses solved coordinates instead.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires nothing; the problem and seed builder borrow the callback during solve, and the playback factory receives no callback.
     */
    share: (seconds: number) => number;
  }
  /**
   * A laid course as `admitted` read it (`HumanArmTrajectoryLaid.IAdmitted`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the owner of the record and its role between `admitted` and `solve`.
   * @evidence contracts/development/design.md#principled-representation The owner's record unchanged: the course's readers, its verdict and its reading.
   * @evidence contracts/development/design.md#minimal-and-owned-surface An alias, so ArmPlanned and ArmCourse keep one namespace for the course and the solve.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No member is restated or adapted.
   */
  export type IAdmitted = HumanArmTrajectoryLaid.IAdmitted;

  /**
   * A course laid without optimisation and read by the model
   * (`HumanArmTrajectoryLaid.admitted`, which states how it is laid, timed
   * and admitted). The alias transforms no input and adds no state.
   */
  export const admitted: typeof HumanArmTrajectoryLaid.admitted =
    HumanArmTrajectoryLaid.admitted;

  /**
   * The interface contract (`IAutoMovieMotionHumanArmTrajectory.IState`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents HumanArmTrajectory.IState: The interface contract (`IAutoMovieMotionHumanArmTrajectory.IState`).
   * @evidence contracts/development/design.md#principled-representation The record is the interface's (`IAutoMovieMotionHumanArmTrajectory.IState`); the alias adds nothing.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Kept so this owner's readers name the record by its owner, as master keeps such aliases.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No copy of the record: one declaration, in `@automovie/interface`.
   */
  export type IState = IAutoMovieMotionHumanArmTrajectory.IState;

  /**
   * What `solve` gives: the arms' readers and the state they were read from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two members and their order.
   * @evidence contracts/development/design.md#principled-representation The playback readers beside the solution they play, one per arm in the problem's order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface ArmPlanned reads both: the readers for the carry, the state for a replan.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The state is the solution itself, not a summary of it.
   */
  export interface ISolved {
    /** Each arm's trajectory, in the problem's order. */
    trajectories: IAutoMovieMotionHumanArmTrajectory.Trajectory[];

    /** The solution, for a later solve of the same action to start from. */
    state: IState;
  }

  /**
   * What a plan tells besides its result: whether it was solved in its
   * mirror image, which `solve` reads to tell a refusal in the author's
   * names, and the solution a refusal for time was reached at, which the
   * caller hands to the plan at the slower time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States who sets and who reads each member.
   * @evidence contracts/development/design.md#principled-representation One record shared by `solve`, its plan and its caller.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Written by planHumanArmTrajectory and read by solve and AutoMovieMotionHumanArmPlanned.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A record rather than a return value, so a thrown refusal still carries it.
   */
  export interface IMirrorTold {
    /** Whether the plan read the mirror image. */
    flip: boolean;

    /** The solution a `duration` refusal was reached at, in the plan's own reading (mirrored where `flip`), as `ISolved.state` holds one: a path the speed bound alone refuses, which the same path over the span the refusal names meets (Hollerbach 1984), so the replan at that span starts from it (`warm`). Absent for any other end. */
    state?: IState;
  }

  /**
   * Solve the problem on its knots and admit it on the frame grid.
   *
   * The knots are first split where their sites' interpolant leaves the
   * act's own site (`HumanArmRefine.unbounded`), which needs no solve. The
   * trajectory is then optimised on the knots, its interpolant read on the
   * frame grid (`HumanArmTrajectoryAdmission.read`), and every interval the
   * reading fails in, and those about a knot the solve itself could not
   * meet its constraints at, split and the trajectory solved again from
   * itself at the penalty it reached, until the reading admits it or no
   * failing interval is two frames long: the check-and-refine loop of a
   * continuous collision check, on every term of the model.
   *
   * @param read The problem on given waypoints' seconds.
   * @param times The first knots' seconds, ascending, each taken to the frame grid's nearest instant: knots are grid instants, so a stretch refined to the end is bounded at the very instants it is admitted at, and the admission there is the knots' own evaluation.
   * @param course A laid course the model refused (`admitted`): where its reading is given, only the stretches about the instants it fails at are optimised, each from the course and between two of its instants held fixed, the rest of the course kept; where that is refused, or the course carries no reading (a stretch cut from one), the whole span is solved from it at the knots; the sampling planner's seed (`HumanArmSeed`) on a grid of thirtieths of a second when absent, and after a course with a reading when it leads to no admitted trajectory.
   * @param warm An earlier solution of this action on this span's seconds (`ISolved.state`, retimed by the caller where the span changed): tried first as it stands and returned where the model admits it at its knots and on the frame grid, the optimiser's start at its penalty where not, and dropped for the planner's seed where that ends unadmitted: the warm solution is the earlier plan's own solve from the course, continued, so the course is not solved cold again. Any state is safe to give: nothing of it is trusted.
   * @param stretches Whether the span is its law's own, lengthened by a replan at a slower tempo; a laid course refused only for its speed is then handed back for the span it needs before any optimisation. False for a span a meeting fixes.
   * @param told Where the plan tells whether it read the mirror image and, with a `duration` refusal, the solution it was reached at (`IMirrorTold.state`); a fresh record when absent.
   * @returns Each arm's trajectory, in the problem's order, and the solution.
   * @throws {HumanRefusal} When no trajectory meets the constraints at its knots and on the frame grid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the seeds, the three refinements, the admission, ordered action seconds, the mirror solve and the refusal; playback borrows the final setup/time/coordinate data through a separate factory.
   * @evidence contracts/development/implementation.md#principled-implementation TrajOpt's few knots with a continuous reading between them (Schulman et al. 2013, sections V and VI), the reading here the model's own evaluation of the played interpolant on the frame grid, so nothing the film samples rests on the knots alone; a second initialisation only when the first ends unadmitted (their multiple initialisations).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The site refinement, one optimisation, then the admit-split-continue loop; a module-private factory creates each returned reader outside the builder's lexical environment.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A trajectory is returned only when its frame-grid reading, the optimiser's own last evaluation of the knots' interpolant, is within the model's tolerance; no bound is scaled to stand in for the reading.
   * @evidence contracts/development/implementation.md#efficient-algorithms The optimiser's variables and its rounds' readings are the knots', a few per transport, their intervals checked by swept spheres, and the frame grid is read once per converged path to certify it (TrajOpt's continuous-time check, Schulman et al. 2014, section IV-C); an interval the grid fails between knots is split and solved again, and only a miss at the knots themselves continues on the grid's own instants. A laid course is optimised only on the stretches about its failing instants, the closed form kept wherever the model admits it, so the solve's size is the defect's, not the span's. Measured on a tai chi push on f-small, whose course fails at one instant of a 12 s span: 36 s to 8.4 s. A hold's configuration found by the precheck is the planner seed's own, not solved twice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A course's reading lends its context builder and its grid context, the same body, arms, bases and sites by identity, so the grid's frames and waypoint records are built once for the course and the solve; continued contexts keep the waypoint records of the knots they share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned readers retain only the setup list, final times, coordinate arrays and their arm index; the problem/read callbacks, contexts and readings are released on return or throw.
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
