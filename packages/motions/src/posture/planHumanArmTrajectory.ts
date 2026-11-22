import type {
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanArmTrajectory,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmOptimiser } from "./HumanArmOptimiser";
import { HumanArmRefine } from "./HumanArmRefine";
import { HumanArmSeed } from "./HumanArmSeed";
import { HumanArmTrajectory } from "./HumanArmTrajectory";
import { HumanArmTrajectoryAdmission as Admission } from "./HumanArmTrajectoryAdmission";
import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import { HumanArmTrajectoryKnots as Knots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryMirror as Mirror } from "./HumanArmTrajectoryMirror";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPace as Pace } from "./HumanArmTrajectoryPace";
import { HumanArmTrajectoryPlayback } from "./HumanArmTrajectoryPlayback";

/**
 * The work of `HumanArmTrajectory.solve`: site refinement, the optimisation
 * on the knots and the admit-split-continue loop on the frame grid, as that
 * function documents. It records in `told` whether it reads the mirror
 * image, so `solve` can tell a refusal in the author's names.
 *
 * @param read The problem on given waypoints' seconds.
 * @param times The first knots' seconds, ascending, on the frame grid.
 * @param course A laid course the model refused, when one was read.
 * @param warm An earlier solution of this action on this span's seconds.
 * @param stretches Whether the span is its law's own, lengthened by a replan.
 * @param told Set when the problem is solved in its mirror image.
 * @returns Each arm's trajectory, in the problem's order, and the solution.
 * @throws {HumanRefusal} When no trajectory meets the constraints at its knots and on the frame grid.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the mirror record and the refusal; HumanArmTrajectory.solve documents the method.
 * @evidence contracts/development/implementation.md#principled-implementation TrajOpt's few knots with a continuous reading between them, refined where the frame-grid admission fails, as HumanArmTrajectory.solve states.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The site refinement, one optimisation, then the admit-split-continue loop; solve keeps only the mirror-name translation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A trajectory is returned only when its frame-grid reading admits it; otherwise the refusal stands.
 * @evidence contracts/development/implementation.md#efficient-algorithms The optimiser's variables and its rounds' readings are the knots'; refinement splits only failing intervals.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A warm solution and a laid course's reading are reused only for this action's span.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned readers retain only the setups, final times and solution state.
 */
export function planHumanArmTrajectory(
  read: (times: readonly number[]) => HumanArmTrajectory.IProblem,
  times: readonly number[],
  course: HumanArmTrajectory.IAdmitted | undefined,
  warm: HumanArmTrajectory.IState | undefined,
  stretches: boolean,
  told: HumanArmTrajectory.IMirrorTold,
): HumanArmTrajectory.ISolved {
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
  const first: HumanArmTrajectory.IProblem = read(seconds(knots));
  const flip: boolean = Mirror.leftFirst(first);
  told.flip = flip;
  const reading: (times: readonly number[]) => HumanArmTrajectory.IProblem =
    flip
      ? (t: readonly number[]): HumanArmTrajectory.IProblem =>
          Mirror.mirrored(read(t))
      : read;
  let problem: HumanArmTrajectory.IProblem = flip
    ? Mirror.mirrored(first)
    : first;
  const contextOf: ReturnType<typeof HumanArmTrajectoryContext.prepare> =
    course?.read.of ??
    HumanArmTrajectoryContext.prepare(
      problem.body,
      problem.arms.map(
        (arm: HumanArmTrajectory.IArm): "left" | "right" => arm.side,
      ),
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
        reason: `the laid course of the ${problem.arms.map((a: HumanArmTrajectory.IArm): string => a.side).join(" and ")} arm over the action moves faster than the law's own pace`,
        fix: "give the action more time",
      });
  }
  // A laid course that misses a site or a task point at a hold instant
  // missed it with the limb fit's own search at that instant, against the
  // same clearance: the optimiser has no configuration there the fit did
  // not, only a long solve to the same refusal. It is refused at once,
  // naming what holds the hand off, so an infeasible hold never costs
  // minutes.
  const missed: M.IEvaluation["worst"] | undefined =
    course !== undefined &&
    warm === undefined &&
    (course.refused === "site" || course.refused === "limit")
      ? course.read.evaluation?.worst
      : undefined;
  if (missed !== undefined && missed.value > M.TOLERANCE)
    throw new HumanRefusal({
      kind: "reach",
      axis: missed.axis,
      value: missed.value,
      feasible: null,
      reason: `no path of the ${problem.arms.map((a: HumanArmTrajectory.IArm): string => a.side).join(" and ")} arm over the action keeps the hand on its site: ${missed.what}`,
      fix: "put the hand on a site its arm reaches with the body clear",
    });

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
    while (solved.evaluation.worst.value > M.TOLERANCE && context.n < fine.n) {
      // A hand that misses its site or a task point at a knot itself misses
      // it with every freedom the path had there: a finer interval adds no
      // configuration that reaches it, only a larger problem to solve again.
      // Such a path is refused as it stands, naming what holds the hand off,
      // instead of being refined down to the frame grid at growing cost.
      const knotted: ReadonlySet<number> = new Set(knots);
      if (
        (solved.evaluation.worst.term === "site" ||
          solved.evaluation.worst.term === "limit") &&
        solved.evaluation.failing.some(
          (failed: boolean, g: number): boolean => failed && knotted.has(g),
        )
      )
        break;
      // A frame depends on its bracket and the adjacent Hermite slopes.
      // Open every such interval for all failed frames in the same pass.
      const affected: Set<number> = new Set();
      let bracket: number = 0;
      solved.evaluation.failing.forEach((failed: boolean, g: number): void => {
        while (bracket + 2 < knots.length && knots[bracket + 1]! <= g)
          ++bracket;
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
    laid: HumanArmTrajectory.IAdmitted,
    verdict: M.IEvaluation,
  ): HumanArmTrajectory.ISolved | undefined => {
    if (fine.still) return undefined;
    const stretches: [number, number][] = [];
    verdict.failing.forEach((failing: boolean, g: number): void => {
      if (!failing) return;
      let before: number = 0;
      while (before + 1 < snapped.length && snapped[before + 1]! < g) ++before;
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
    const x: number[][][] = laid.read.x.map((arm: number[][]): number[][] => [
      ...arm,
    ]);
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
      const cut = (
        p: HumanArmTrajectory.IProblem,
      ): HumanArmTrajectory.IProblem => ({
        ...p,
        arms: p.arms.map(
          (
            arm: HumanArmTrajectory.IArm,
            a: number,
          ): HumanArmTrajectory.IArm => ({
            ...arm,
            ...(from > 0
              ? { rest: start[a]!, back: arm.back ?? arm.rest }
              : {}),
            ...(to < grid.length - 1
              ? {
                  back: end[a]!,
                  sites: arm.sites.map(
                    (
                      s: HumanArmTrajectory.ISite | undefined,
                      k: number,
                    ): HumanArmTrajectory.ISite | undefined =>
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
      let solved: HumanArmTrajectory.ISolved;
      try {
        solved = HumanArmTrajectory.solve(
          (t: readonly number[]): HumanArmTrajectory.IProblem => cut(read(t)),
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
      const played: number[][][] = Knots.splice(
        solved.state.times,
        solved.state.x,
        grid,
        laid.read.x,
        from,
        to,
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
    if (
      M.evaluate(fine, x, { reading: verdict, laid: changed }).worst.value >
      M.TOLERANCE
    )
      return undefined;
    return {
      trajectories: problem.arms.map(
        (
          _: HumanArmTrajectory.IArm,
          a: number,
        ): IAutoMovieMotionHumanArmTrajectory.Trajectory =>
          HumanArmTrajectoryPlayback(fine.setups, fine.times, x, a),
      ),
      state: { times: [...fine.times], x, penalty },
    };
  };

  // A laid course seeds the optimiser in place of the sampling planner;
  // a course that leads it to no admitted trajectory is followed by the
  // planner's seed on the first knots, TrajOpt's multiple
  // initialisations (Schulman et al. 2013, section VI).
  const initial: HumanArmTrajectory.IProblem = problem;

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
    const repaired: HumanArmTrajectory.ISolved | undefined = repair(
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
    // The path a refusal for time was reached at is the replan's start:
    // over the span the refusal names, the same path moves within the bound
    // (Hollerbach 1984), so the replan at the slower time begins where this
    // solve ended rather than solving the whole span again.
    if (worst.axis === "duration")
      told.state = { times: [...at], x: last.x, penalty: last.penalty };
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
      reason: `no path of the ${problem.arms.map((a: HumanArmTrajectory.IArm): string => a.side).join(" and ")} arm over the action keeps the hand on its site, the arm clear and its speed within the law's own pace: ${worst.what}`,
      fix:
        worst.axis === "duration"
          ? "give the action more time"
          : "put the hand on a site its arm reaches with the body clear",
    });
  }
  const setups: IAutoMovieMotionHumanArmGeometry.ISetup[] = context.setups;
  return {
    trajectories: problem.arms.map(
      (
        _: HumanArmTrajectory.IArm,
        a: number,
      ): IAutoMovieMotionHumanArmTrajectory.Trajectory =>
        HumanArmTrajectoryPlayback(setups, at, last.x, a),
    ),
    state: { times: [...at], x: last.x, penalty: last.penalty },
  };
}
