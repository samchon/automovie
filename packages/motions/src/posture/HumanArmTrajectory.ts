import type {
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanArmTrajectory,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmOptimiser } from "./HumanArmOptimiser";
import { HumanArmRefine } from "./HumanArmRefine";
import { HumanArmSeed } from "./HumanArmSeed";
import { HumanArmTrajectoryAdmission as Admission } from "./HumanArmTrajectoryAdmission";
import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import { HumanArmTrajectoryKnots as Knots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryLaid } from "./HumanArmTrajectoryLaid";
import { HumanArmTrajectoryMirror as Mirror } from "./HumanArmTrajectoryMirror";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPace as Pace } from "./HumanArmTrajectoryPace";
import { HumanArmTrajectoryPlayback } from "./HumanArmTrajectoryPlayback";

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
   * @param warm An earlier solution of this action on this span's seconds (`ISolved.state`, retimed by the caller where the span changed): tried first as it stands and returned where the model admits it at its knots and on the frame grid, the optimiser's start at its penalty where not, and dropped for the course and the planner's seed where that ends unadmitted. Any state is safe to give: nothing of it is trusted.
   * @param stretches Whether the span is its law's own, lengthened by a replan at a slower tempo; a laid course refused only for its speed is then handed back for the span it needs before any optimisation. False for a span a meeting fixes.
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
  ): ISolved {
    // A problem solved in its mirror image refuses in the mirror's names,
    // told here in the author's (`HumanArmTrajectoryMirror.refusal`).
    const told: { flip: boolean } = { flip: false };
    try {
      return planned(read, times, course, warm, stretches, told);
    } catch (error) {
      if (told.flip && error instanceof HumanRefusal)
        throw Mirror.refusal(error);
      throw error;
    }
  }

  /** `solve`'s work, which records in `told` whether it reads the mirror image. */
  function planned(
    read: (times: readonly number[]) => IProblem,
    times: readonly number[],
    course: IAdmitted | undefined,
    warm: IState | undefined,
    stretches: boolean,
    told: { flip: boolean },
  ): ISolved {
    // The frame grid over the span, the instants the played trajectory is
    // admitted at: the course's own where one was read. The knots are
    // instants of that grid, the nearest to the caller's, so a stretch
    // refined to the end is bounded at exactly the instants it is read at.
    const grid: readonly number[] =
      course?.read.context.times ??
      Pace.uniform(times[0]!, times[times.length - 1]!);
    const snap = (of: readonly number[]): number[] => {
      const out: number[] = [0];
      let near: number = 0;
      for (const t of of) {
        while (
          near + 1 < grid.length &&
          Math.abs(grid[near + 1]! - t) <= Math.abs(grid[near]! - t)
        )
          ++near;
        if (near > out[out.length - 1]!) out.push(near);
      }
      if (out[out.length - 1] !== grid.length - 1) out.push(grid.length - 1);
      return out;
    };
    const snapped: number[] = snap(times);
    let knots: number[] = snapped;
    const seconds = (of: readonly number[]): number[] =>
      of.map((g: number): number => grid[g]!);
    const first: IProblem = read(seconds(knots));
    const flip: boolean = Mirror.leftFirst(first);
    told.flip = flip;
    const reading: (times: readonly number[]) => IProblem = flip
      ? (t: readonly number[]): IProblem => Mirror.mirrored(read(t))
      : read;
    let problem: IProblem = flip ? Mirror.mirrored(first) : first;
    const contextOf: ReturnType<typeof HumanArmTrajectoryContext.prepare> =
      course?.read.of ??
      HumanArmTrajectoryContext.prepare(
        problem.body,
        problem.arms.map((arm: IArm): "left" | "right" => arm.side),
      );
    const fine: M.IContext = course?.read.context ?? contextOf(reading(grid));
    let context: M.IContext = contextOf(problem, fine);

    // A laid course whose worst term is its speed is met by the same course
    // over a longer span: scaling time by a factor divides every speed by it
    // (Hollerbach 1984), so the span the course needs is its own times its
    // fastest probe's speed over the bound. Where the span is the law's own,
    // which a replan at a slower tempo lengthens (`stretches`), no
    // trajectory is optimised at this span for it: the caller is handed that
    // span at once, as the optimiser's refusal hands it below. A span an end
    // of which a meeting fixes is not lengthened by the tempo, so its course
    // goes to the optimiser, which may find a shorter path within it.
    if (
      stretches &&
      course !== undefined &&
      warm === undefined &&
      course.refused === "speed"
    ) {
      const span: number = fine.times[fine.n - 1]! - fine.times[0]!;
      const factor: number = Pace.slower(
        fine,
        course.read.x,
        course.read.evaluation?.placed,
      );
      if (factor > 1)
        throw new HumanRefusal({
          kind: "reach",
          axis: "duration",
          value: span,
          feasible: {
            kind: "range",
            minimum: Pace.duration(span * factor),
            maximum: null,
            unit: "s",
          },
          reason: `the laid course of the ${problem.arms.map((a: IArm): string => a.side).join(" and ")} arm over the action moves faster than the law's own pace`,
          fix: "give the action more time",
        });
    }
    // The arms carried by their own interpolant onto knots with the given
    // intervals split; the knots kept keep what the last context built.
    const refine = (
      x: number[][][],
      split: readonly number[],
    ): number[][][] => {
      const next: number[] = HumanArmRefine.split(knots, split);
      const carried: number[][][] = x.map((arm: number[][]): number[][] =>
        next.map((g: number): number[] =>
          HumanArmRefine.hermite(context.times, arm, grid[g]!),
        ),
      );
      knots = next;
      problem = reading(seconds(next));
      context = contextOf(problem, context);
      return carried;
    };
    type Solved = {
      x: number[][][];
      evaluation: M.IEvaluation;
      penalty: number;
      played: Admission.IReading;
    };
    const optimised: (from: number[][][], penalty?: number) => Solved = (
      from: number[][][],
      penalty?: number,
    ): Solved => {
      let seed: number[][][] = from;
      for (
        let split: number[] = HumanArmRefine.unbounded(context, fine);
        split.length > 0;
        split = HumanArmRefine.unbounded(context, fine)
      )
        seed = refine(seed, split);
      // The waypoints are knots of the frame grid: the optimiser reads and
      // linearises every grid instant on their interpolant and steps the
      // knots (`HumanArmTrajectoryKnots`), so its last evaluation is the
      // played trajectory's own reading. Where the knots are the grid
      // itself, the reading is theirs.
      //
      let solved: ReturnType<typeof HumanArmOptimiser.optimise> =
        HumanArmOptimiser.optimise(context, seed, penalty, fine);

      // The continuous check's refinement (Schulman et al. 2013, section
      // V): where the knots' converged path fails its frame-grid reading
      // between two knots, that interval and its neighbours are split and
      // the path solved again from itself at the penalty it reached, until
      // the reading admits it or the affected intervals are already frames.
      while (
        solved.evaluation.worst.value > M.TOLERANCE &&
        context.n < fine.n
      ) {
        // A frame depends on its bracket and the adjacent Hermite slopes.
        // Open every such interval for all failed frames in the same pass.
        const affected: Set<number> = new Set();
        let bracket: number = 0;
        solved.evaluation.failing.forEach((failed: boolean, g: number): void => {
          while (bracket + 2 < knots.length && knots[bracket + 1]! <= g) ++bracket;
          if (!failed) return;
          for (const i of [bracket - 1, bracket, bracket + 1])
            if (i >= 0 && i + 1 < knots.length && knots[i + 1]! - knots[i]! >= 2)
              affected.add(i);
        });
        const split: number[] = [...affected];
        if (split.length === 0) break;

        // The refinement replaces the context, so it runs before the solve
        // reads it.
        const carried: number[][][] = refine(solved.x, split);
        solved = HumanArmOptimiser.optimise(
          context,
          carried,
          solved.penalty,
          fine,
        );
      }
      const played: Admission.IReading =
        !context.still && fine.n > context.n
          ? {
              x: Knots.read(context.times, fine.times, solved.x),
              evaluation: solved.evaluation,
            }
          : Admission.read(context, fine, solved.x);
      return { ...solved, played };
    };
    const met = (solved: Solved): boolean =>
      solved.played.evaluation.worst.value <= M.TOLERANCE;

    // The closed form first: a laid course is kept wherever the model admits
    // it, and only the stretches it fails on are optimised, each between two
    // instants of the course held fixed, the rest of the course played as it
    // was laid. A stretch is the failing instants widened to the knot before
    // and after them and one knot interval more on either side, the room
    // the optimiser's cubic needs to leave the course and rejoin it; touching
    // stretches are one. The course with its stretches solved is admitted by
    // the model's reading of the whole frame grid, the test any solved
    // trajectory is admitted by; a stretch that is refused, a course that
    // fails over its whole span, or a splice the reading refuses leaves the
    // whole span to the optimiser below.
    const repair = (
      laid: IAdmitted,
      verdict: M.IEvaluation,
    ): ISolved | undefined => {
      if (fine.still) return undefined;
      const stretches: [number, number][] = [];
      verdict.failing.forEach((failing: boolean, g: number): void => {
        if (!failing) return;
        let before: number = 0;
        while (before + 1 < snapped.length && snapped[before + 1]! < g)
          ++before;
        let after: number = snapped.length - 1;
        while (after > 0 && snapped[after - 1]! > g) --after;
        const from: number = snapped[Math.max(0, before - 1)]!;
        const to: number = snapped[Math.min(snapped.length - 1, after + 1)]!;
        const last: [number, number] | undefined =
          stretches[stretches.length - 1];
        if (last !== undefined && from <= last[1])
          last[1] = Math.max(last[1], to);
        else stretches.push([from, to]);
      });
      if (
        stretches.length === 0 ||
        (stretches.length === 1 &&
          stretches[0]![0] === 0 &&
          stretches[0]![1] === grid.length - 1)
      )
        return undefined;
      const x: number[][][] = laid.read.x.map((arm: number[][]): number[][] => [...arm]);
      const changed: boolean[] = new Array<boolean>(grid.length).fill(false);
      let penalty: number = 0;
      for (const [from, to] of stretches) {
        // The stretch's problem: the course's arms at its two instants as
        // its rest and its return, its last instant fixed where the span goes
        // on past it.
        const start: IAutoMovieMotionHumanArmClearance.IArm[] =
          laid.trajectories.map(
            (
              t: IAutoMovieMotionHumanArmTrajectory.Trajectory,
            ): IAutoMovieMotionHumanArmClearance.IArm => t(grid[from]!),
          );
        const end: IAutoMovieMotionHumanArmClearance.IArm[] =
          laid.trajectories.map(
            (
              t: IAutoMovieMotionHumanArmTrajectory.Trajectory,
            ): IAutoMovieMotionHumanArmClearance.IArm => t(grid[to]!),
          );
        const cut = (p: IProblem): IProblem => ({
          ...p,
          arms: p.arms.map(
            (arm: IArm, a: number): IArm => ({
              ...arm,
              ...(from > 0 ? { rest: start[a]!, back: arm.back ?? arm.rest } : {}),
              ...(to < grid.length - 1
                ? {
                    back: end[a]!,
                    sites: arm.sites.map(
                      (s: ISite | undefined, k: number): ISite | undefined =>
                        k === arm.sites.length - 1 ? undefined : s,
                    ),
                  }
                : {}),
            }),
          ),
        });
        const within = (t: number): boolean =>
          t > grid[from]! + 1e-9 && t < grid[to]! - 1e-9;
        const own: number[] = grid.slice(from, to + 1);
        const local: M.IContext = contextOf(cut(reading(own)), fine);
        // The course goes on beyond the stretch, so its ends' accelerations
        // read the course's next instants, not an arm at rest.
        local.beyond = {
          ...(from > 0
            ? { before: x.map((arm: number[][]): number[] => arm[from - 1]!) }
            : {}),
          ...(to < grid.length - 1
            ? { after: x.map((arm: number[][]): number[] => arm[to + 1]!) }
            : {}),
        };
        let solved: ISolved;
        try {
          solved = solve(
            (t: readonly number[]): IProblem => cut(read(t)),
            [grid[from]!, ...times.filter(within), grid[to]!],
            {
              trajectories: laid.trajectories,
              admitted: false,
              refused: laid.refused,
              read: {
                of: contextOf,
                context: local,
                x: x.map((arm: number[][]): number[][] =>
                  arm.slice(from, to + 1),
                ),
              },
            },
          );
        } catch (error) {
          if (error instanceof HumanRefusal) return undefined;
          throw error;
        }
        const played: number[][][] = Knots.read(
          solved.state.times,
          own,
          solved.state.x,
        );
        // Interior joins hold their last pose. An open end of the full
        // action is a solved contact and must keep the repaired last frame.
        const after: number = to === grid.length - 1 && fine.open ? to + 1 : to;
        for (let g: number = from + 1; g < after; ++g) {
          changed[g] = true;
          for (let a: number = 0; a < x.length; ++a)
            x[a]![g] = played[a]![g - from]!;
        }
        penalty = Math.max(penalty, solved.state.penalty);
      }
      if (M.evaluate(fine, x, { reading: verdict, laid: changed }).worst.value > M.TOLERANCE)
        return undefined;
      return {
        trajectories: problem.arms.map(
          (_: IArm, a: number): IAutoMovieMotionHumanArmTrajectory.Trajectory =>
            HumanArmTrajectoryPlayback(fine.setups, fine.times, x, a),
        ),
        state: { times: [...fine.times], x, penalty },
      };
    };

    // A laid course seeds the optimiser in place of the sampling planner;
    // a course that leads it to no admitted trajectory is followed by the
    // planner's seed on the first knots, TrajOpt's multiple
    // initialisations (Schulman et al. 2013, section VI).
    const initial: IProblem = problem;

    // An earlier plan's solution of this action is tried first: on its own
    // knots as it stands, returned where the model admits it at them and on
    // the frame grid, and continued from at its penalty where not.
    let solved: Solved | undefined;
    if (warm !== undefined && warm.x.length === initial.arms.length) {
      knots = snap(warm.times);
      problem = reading(seconds(knots));
      context = contextOf(problem, fine);
      const c: M.IContext = context;
      const seed: number[][][] = warm.x.map(
        (arm: readonly (readonly number[])[], a: number): number[][] =>
          knots.map((g: number, k: number): number[] =>
            k === 0
              ? [...c.rest[a]!]
              : k === c.n - 1 && !c.open
                ? [...c.back[a]!]
                : M.ranged(
                    c,
                    a,
                    HumanArmRefine.hermite(warm.times, arm, grid[g]!),
                  ),
          ),
      );
      const kept: Solved = {
        x: seed,
        evaluation: M.evaluate(c, seed),
        penalty: warm.penalty,
        played: Admission.read(c, fine, seed),
      };
      solved = met(kept) ? kept : optimised(seed, warm.penalty);
      if (!met(solved)) {
        solved = undefined;
        knots = snapped;
        problem = initial;
        context = contextOf(problem, fine);
      }
    }
    if (solved === undefined && course?.read.evaluation !== undefined) {
      const repaired: ISolved | undefined = repair(
        course,
        course.read.evaluation,
      );
      if (repaired !== undefined) return repaired;
    }
    if (solved === undefined) {
      const laid: number[][][] | undefined =
        course === undefined
          ? undefined
          : Pace.coursed(context, course.trajectories);

      // A hold no configuration meets has no trajectory: it is refused by
      // its own still problem before the whole trajectory's penalties are
      // spent on it (`HumanArmSeed.held`), and the configuration found is
      // the planner seed's hold where that seed follows.
      const hold: number[][] | undefined =
        laid === undefined
          ? undefined
          : HumanArmSeed.held(problem, context, laid);
      solved = optimised(laid ?? HumanArmSeed.seed(problem, context));
      // A stretch cut from a course is solved from that course alone: its
      // refusal leaves the whole span to the optimiser.
      if (course?.read.evaluation !== undefined && !met(solved)) {
        knots = snapped;
        problem = initial;
        context = contextOf(problem, fine);
        solved = optimised(HumanArmSeed.seed(problem, context, hold));
      }
    }
    const last: Solved = solved;
    const n: number = context.n;
    const at: readonly number[] = context.times;
    if (!met(last)) {
      const worst: M.IEvaluation["worst"] =
        last.evaluation.worst.value > M.TOLERANCE
          ? last.evaluation.worst
          : last.played.evaluation.worst;
      throw new HumanRefusal({
        kind: "reach",
        axis: worst.axis,
        value: worst.axis === "duration" ? at[n - 1]! - at[0]! : worst.value,
        // A path too fast for the speed bound is met by the same path over a
        // longer span: scaling time by a factor divides every speed by it
        // (Hollerbach 1984, "Dynamic scaling of manipulator trajectories"),
        // so the span it needs is its own times the fastest probe's speed over
        // the bound, read at the knots and on the frame grid.
        feasible:
          worst.axis === "duration"
            ? {
                kind: "range",
                minimum: Pace.duration(
                  (at[n - 1]! - at[0]!) *
                  Math.max(
                    Pace.slower(context, last.x),
                    Pace.slower(fine, last.played.x),
                  ),
                ),
                maximum: null,
                unit: "s",
              }
            : null,
        reason: `no path of the ${problem.arms.map((a: IArm): string => a.side).join(" and ")} arm over the action keeps the hand on its site, the arm clear and its speed within the law's own pace: ${worst.what}`,
        fix:
          worst.axis === "duration"
            ? "give the action more time"
            : "put the hand on a site its arm reaches with the body clear",
      });
    }
    const setups: IAutoMovieMotionHumanArmGeometry.ISetup[] = context.setups;
    return {
      trajectories: problem.arms.map(
        (_: IArm, a: number): IAutoMovieMotionHumanArmTrajectory.Trajectory =>
          HumanArmTrajectoryPlayback(setups, at, last.x, a),
      ),
      state: { times: [...at], x: last.x, penalty: last.penalty },
    };
  }
}
