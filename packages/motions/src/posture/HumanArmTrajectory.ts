import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanArmClearance } from "./HumanArmClearance";
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
import { HumanArmTrajectoryPlayback } from "./HumanArmTrajectoryPlayback";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectoryTravel as V } from "./HumanArmTrajectoryTravel";

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
 * (Erdmann and Lozano-P챕rez 1987, Algorithmica 2:477). A problem whose first
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
    rest: HumanArmClearance.IArm;
    /** The arm at the last waypoint, where it returns to another arm than it left (a gesture that leaves from the entry and returns to the rest); `rest` when absent. */
    back?: HumanArmClearance.IArm;
    /** Its site at each waypoint, on the hold. */
    sites: readonly (ISite | undefined)[];
    /** The arm the goal's own solution gives at the hold's start, where its inverse kinematics starts first (`HumanArmSeed`). */
    guess?: HumanArmClearance.IArm;
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
    body: IHumanBody;
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
   * An arm at any second of the solved span.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Declares action seconds and the existing clinical arm result returned by setup conversion of interpolated coordinates.
   * @evidence contracts/development/design.md#principled-representation A time reader preserves random-order playback through the same Hermite trajectory instead of storing displayed poses.
   * @evidence contracts/development/design.md#minimal-and-owned-surface ArmCarry stores this callback and reads its arm; no optimiser/context getter is exposed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias adds no endpoint clamping, interpolation policy or validation; the solve-produced reader retains the existing numerical owners.
   */
  export type Trajectory = (seconds: number) => HumanArmClearance.IArm;

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
   * A solved trajectory as plan data: what a later solve of the same action
   * (a replan at another start or over a longer span) starts from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning, frame and what the record is for.
   * @evidence contracts/development/design.md#principled-representation The knots' seconds, each arm's coordinates at each knot in the frame the problem was solved in (its mirror image for a left-first problem), and the penalty reached, the three things a penalty method's continuation needs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `solve` and taken back by `solve`; a holder passes it on unread.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No verdict is carried: a state is only a start, admitted anew by the solve that takes it.
   */
  export interface IState {
    /** The knots' seconds, ascending. */
    times: readonly number[];

    /** Each arm's coordinates at each knot, in the solved problem's own order and mirror image. */
    x: readonly (readonly (readonly number[])[])[];

    /** The penalty the solution was reached at. */
    penalty: number;
  }

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
    trajectories: Trajectory[];

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
   * @param course A laid course the model refused (`admitted`), read at the knots as the seed, its reading's context the frame grid; the sampling planner's seed (`HumanArmSeed`) on a grid of thirtieths of a second when absent, and after the course when it leads to no admitted trajectory.
   * @param warm An earlier solution of this action on this span's seconds (`ISolved.state`, retimed by the caller where the span changed): tried first as it stands and returned where the model admits it at its knots and on the frame grid, the optimiser's start at its penalty where not, and dropped for the course and the planner's seed where that ends unadmitted. Any state is safe to give: nothing of it is trusted.
   * @param stretches Whether the span is its law's own, lengthened by a replan at a slower tempo; a laid course refused only for its speed is then handed back for the span it needs before any optimisation. False for a span a meeting fixes.
   * @returns Each arm's trajectory, in the problem's order, and the solution.
   * @throws {HumanRefusal} When no trajectory meets the constraints at its knots and on the frame grid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the seeds, the three refinements, the admission, ordered action seconds, the mirror solve and the refusal; playback borrows the final setup/time/coordinate data through a separate factory.
   * @evidence contracts/development/implementation.md#principled-implementation TrajOpt's few knots with a continuous reading between them (Schulman et al. 2013, sections V and VI), the reading here the model's own evaluation of the played interpolant on the frame grid, so nothing the film samples rests on the knots alone; a second initialisation only when the first ends unadmitted (their multiple initialisations).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The site refinement, one optimisation, then the admit-split-continue loop; a module-private factory creates each returned reader outside the builder's lexical environment.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A trajectory is returned only when its frame-grid reading, the optimiser's own last evaluation of the knots' interpolant, is within the model's tolerance; no bound is scaled to stand in for the reading.
   * @evidence contracts/development/implementation.md#efficient-algorithms The optimiser's variables are the knots', a few per transport, instead of the frame grid's, while every evaluation and linearisation is the grid's (`HumanArmTrajectoryKnots`); a solve is one optimisation, with no refinement after it. A hold's configuration found by the precheck is the planner seed's own, not solved twice.
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
    // The frame grid over the span, the instants the played trajectory is
    // admitted at: the course's own where one was read. The knots are
    // instants of that grid, the nearest to the caller's, so a stretch
    // refined to the end is bounded at exactly the instants it is read at.
    const grid: readonly number[] =
      course?.read.context.times ?? uniform(times[0]!, times[times.length - 1]!);
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
    // The first knots: the caller's, and the seconds at which a laid
    // transport's time law turns from its ramp to its cruise and back
    // (`IAdmitted.ramps`), so the knots' cubic can draw the cruise at the
    // speed bound the law timed the transport by.
    const snapped: number[] = snap(
      course === undefined || course.ramps.length === 0
        ? times
        : [...times, ...course.ramps].sort((p: number, q: number): number => p - q),
    );
    let knots: number[] = snapped;
    const seconds = (of: readonly number[]): number[] =>
      of.map((g: number): number => grid[g]!);
    const first: IProblem = read(seconds(knots));
    const flip: boolean = Mirror.leftFirst(first);
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
    if (stretches && course !== undefined && warm === undefined && course.refused === "speed") {
      const span: number = fine.times[fine.n - 1]! - fine.times[0]!;
      const factor: number = slower(fine, coursed(fine, course.trajectories));
      if (factor > 1)
        throw new HumanRefusal({
          kind: "reach",
          axis: "duration",
          value: span,
          feasible: { kind: "range", minimum: span * factor, maximum: null, unit: "s" },
          reason: `the laid course of the ${problem.arms.map((a: IArm): string => a.side).join(" and ")} arm over the action moves faster than the audit's ${M.SPEED_LIMIT} m/s`,
          fix: "give the action more time",
        });
    }
    // The arms carried by their own interpolant onto knots with the given
    // intervals split; the knots kept keep what the last context built.
    const refine = (x: number[][][], split: readonly number[]): number[][][] => {
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
    const intervals = (of: readonly number[]): number[] =>
      of.flatMap((g: number, k: number): number[] =>
        k + 1 < of.length && of[k + 1]! - g >= 2 ? [k] : [],
      );
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
      // The solve has two levels and no loop. The knots first; and where
      // their trajectory ends infeasible on the grid, the grid's own
      // instants as knots, the whole problem a frame-grid trajectory always
      // was, continued from the knots' result at its penalty. Nothing is
      // chosen by where a reading failed, so a problem and its mirror take
      // the same level.
      let solved: ReturnType<typeof HumanArmOptimiser.optimise> =
        HumanArmOptimiser.optimise(context, seed, penalty, fine);
      if (solved.evaluation.worst.value > M.TOLERANCE && context.n < fine.n) {
        let carried: number[][][] = solved.x;
        for (
          let wide: number[] = intervals(knots);
          wide.length > 0;
          wide = intervals(knots)
        )
          carried = refine(carried, wide);
        solved = HumanArmOptimiser.optimise(context, carried, solved.penalty, fine);
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
                : M.ranged(c, a, HumanArmRefine.hermite(warm.times, arm, grid[g]!)),
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
    if (solved === undefined) {
      const laid: number[][][] | undefined =
        course === undefined ? undefined : coursed(context, course.trajectories);

      // A hold no configuration meets has no trajectory: it is refused by
      // its own still problem before the whole trajectory's penalties are
      // spent on it (`HumanArmSeed.held`), and the configuration found is
      // the planner seed's hold where that seed follows.
      const hold: number[][] | undefined =
        laid === undefined ? undefined : HumanArmSeed.held(problem, context, laid);
      solved = optimised(laid ?? HumanArmSeed.seed(problem, context));
      if (course !== undefined && !met(solved)) {
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
                minimum:
                  (at[n - 1]! - at[0]!) *
                  Math.max(
                    slower(context, last.x),
                    slower(fine, last.played.x),
                  ),
                maximum: null,
                unit: "s",
              }
            : null,
        reason: `no path of the ${problem.arms.map((a: IArm): string => a.side).join(" and ")} arm over the action keeps the hand on its site, the arm clear and its speed within the audit's ${M.SPEED_LIMIT} m/s: ${worst.what}`,
        fix:
          worst.axis === "duration"
            ? "give the action more time"
            : "put the hand on a site its arm reaches with the body clear",
      });
    }
    const setups: G.ISetup[] = context.setups;
    return {
      trajectories: problem.arms.map(
        (_: IArm, a: number): Trajectory =>
          HumanArmTrajectoryPlayback(setups, at, last.x, a),
      ),
      state: { times: [...at], x: last.x, penalty: last.penalty },
    };
  }

  /**
   * The factor a trajectory's span must grow by for every speed-bounded
   * probe to move within the audit's bound: the largest ratio, over each
   * interval and probe, of the probe's speed to the bound.
   */
  function slower(c: M.IContext, x: readonly (readonly number[])[][]): number {
    let most: number = 1;
    x.forEach((arm: readonly (readonly number[])[], a: number): void => {
      for (let k: number = 0; k + 1 < c.n; ++k) {
        const now: G.IPlaced = G.placed(
          c.setups[a]!,
          c.frames[a]![k]!,
          arm[k]!,
        );
        const next: G.IPlaced = G.placed(
          c.setups[a]!,
          c.frames[a]![k + 1]!,
          arm[k + 1]!,
        );
        const dt: number = c.times[k + 1]! - c.times[k]!;

        // The arm's own travel, against its base (`HumanArmTrajectoryTravel`):
        // slowing the action slows nothing a carrier does.
        for (const p of T.SPEED) {
          const d: IAutoMovieVector3 = V.step(
            c.frames[a]![k]!,
            c.frames[a]![k + 1]!,
            now.probes[p]![0],
            next.probes[p]![0],
          );
          most = Math.max(most, Vector3.length(d) / (M.SPEED_LIMIT * dt));
        }
      }
    });
    return most;
  }
}

/** A course's arms at a context's waypoints as coordinates, its first and returned last waypoint the context's rest and back. */
function coursed(
  c: M.IContext,
  course: readonly HumanArmTrajectory.Trajectory[],
): number[][][] {
  return course.map((reader: HumanArmTrajectory.Trajectory, a: number): number[][] =>
    c.times.map((t: number, k: number): number[] =>
      k === 0
        ? [...c.rest[a]!]
        : k === c.n - 1 && !c.open
          ? [...c.back[a]!]
          : M.ranged(c, a, G.encode(c.setups[a]!, reader(t))),
    ),
  );
}

/** A span's instants a frame apart, its two ends among them: the frame grid where no course gives its own. */
function uniform(start: number, end: number): number[] {
  const grid: number[] = [start];
  for (let j: number = 1; start + j * STEP < end - 1e-9; ++j)
    grid.push(start + j * STEP);
  grid.push(end);
  return grid;
}

/** The frame grid's step, seconds, where no course gives its own grid. */
const STEP: number = 1 / 30;
