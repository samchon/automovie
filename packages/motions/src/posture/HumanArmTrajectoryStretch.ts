import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmOptimiser } from "./HumanArmOptimiser";
import { HumanArmRefine } from "./HumanArmRefine";
import type { HumanArmTrajectory } from "./HumanArmTrajectory";
import { HumanArmTrajectoryAdmission as Admission } from "./HumanArmTrajectoryAdmission";
import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import { HumanArmTrajectoryKnots as Knots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryMirror as Mirror } from "./HumanArmTrajectoryMirror";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPace as Pace } from "./HumanArmTrajectoryPace";
import { HumanArmTrajectoryPlayback } from "./HumanArmTrajectoryPlayback";

/**
 * One stretch of an arm course solved by trajectory optimisation alone:
 * TrajOpt's penalty sequential convex optimisation on a few knots (Schulman et
 * al. 2014, Algorithm 1, `HumanArmOptimiser`), its played interpolant read on
 * the frame grid and every failing interval split and solved again from itself
 * (Schulman et al. 2013, section V), with no other start tried. It is the solve
 * `planHumanArmTrajectory` runs on a whole span, on a stretch its laid course
 * fails, and the solve a caller runs on a stretch of its own course where the
 * arm's closed-form fit loses its admissible swivel (`plan`).
 */
export namespace HumanArmTrajectoryStretch {
  /** A problem read on given waypoints' seconds. */
  export type Reading = (
    times: readonly number[],
  ) => HumanArmTrajectory.IProblem;

  /** The context builder the solve reads every refinement's problem with. */
  export type ContextOf = ReturnType<typeof HumanArmTrajectoryContext.prepare>;

  /** What a solve reads its knots on. */
  export interface IGrid {
    /**
     * The problem on given seconds, in the plan's own reading (mirrored where
     * the plan is).
     */
    reading: Reading;

    /** The context builder. */
    contextOf: ContextOf;

    /** The frame grid's seconds. */
    grid: readonly number[];

    /** The frame grid's context, the admission's reading. */
    fine: M.IContext;
  }

  /** The knots a solve stands on. */
  export interface IKnots {
    /**
     * The knots' indices on the frame grid, ascending, its first and last
     * included.
     */
    knots: number[];

    /** The problem on the knots' seconds. */
    problem: HumanArmTrajectory.IProblem;

    /** Its context. */
    context: M.IContext;
  }

  /**
   * A solve's end: its knots, their coordinates and their reading on the frame
   * grid.
   */
  export interface ISolved extends IKnots {
    /** Each arm's coordinates at each knot. */
    x: number[][][];

    /** The optimiser's last evaluation. */
    evaluation: M.IEvaluation;

    /** The penalty it reached. */
    penalty: number;

    /** The played interpolant's frame-grid reading. */
    played: Admission.IReading;
  }

  /**
   * The frame grid's instants nearest given seconds, as knots: the first and
   * the last instant always, no instant twice.
   *
   * @param grid The frame grid's seconds.
   * @param of The seconds, ascending.
   * @returns The knots' grid indices, ascending.
   */
  export function snap(
    grid: readonly number[],
    of: readonly number[],
  ): number[] {
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
  }

  /**
   * The problem and its context on given knots.
   *
   * @param on The grid.
   * @param knots The knots' grid indices.
   * @returns The knots.
   */
  export function on(grid: IGrid, knots: number[]): IKnots {
    const problem: HumanArmTrajectory.IProblem = grid.reading(
      knots.map((g: number): number => grid.grid[g]!),
    );
    return { knots, problem, context: grid.contextOf(problem, grid.fine) };
  }

  /**
   * The knots' trajectory solved from a seed and refined where its played
   * interpolant fails the frame-grid reading.
   *
   * The knots stay few, TrajOpt's few timesteps: a moving site is held at every
   * frame through the knots' interpolant, which the optimiser reads and
   * linearises on the whole grid (`HumanArmTrajectoryKnots`). Where the
   * converged path fails its frame-grid reading between two knots, that
   * interval and its neighbours are split and the path solved again from itself
   * at the penalty it reached (Schulman et al. 2013, section V), until the
   * reading admits it, the affected intervals are already frames, or the
   * refinement stops paying: at most `REFINEMENTS` passes, each cutting the
   * worst miss by `PROGRESS` of what it was. A hand that misses its site or a
   * task point at a knot whose two intervals are already single frames misses
   * it with every freedom a path can have there, so such a path is returned as
   * it stands.
   *
   * @param grid The grid.
   * @param from The knots the seed stands on.
   * @param seed Each arm's coordinates at each knot.
   * @param penalty The penalty to start at; the optimiser's own when absent.
   * @returns The solve's end, on the knots it ended on.
   */
  export function optimise(
    grid: IGrid,
    from: IKnots,
    seed: number[][][],
    penalty?: number,
  ): ISolved {
    let at: IKnots = from;
    let solved: ReturnType<typeof HumanArmOptimiser.optimise> =
      HumanArmOptimiser.optimise(at.context, seed, penalty, grid.fine);
    let passes: number = 0;
    let previous: number = Infinity;
    while (
      solved.evaluation.worst.value > M.TOLERANCE &&
      at.context.n < grid.fine.n &&
      passes < REFINEMENTS &&
      solved.evaluation.worst.value < previous * (1 - PROGRESS)
    ) {
      previous = solved.evaluation.worst.value;
      ++passes;
      const knots: number[] = at.knots;
      const framed: ReadonlySet<number> = new Set(
        knots.filter(
          (g: number, i: number): boolean =>
            (i === 0 || g - knots[i - 1]! <= 1) &&
            (i === knots.length - 1 || knots[i + 1]! - g <= 1),
        ),
      );
      if (
        (solved.evaluation.worst.term === "site" ||
          solved.evaluation.worst.term === "limit") &&
        solved.evaluation.failing.some(
          (failed: boolean, g: number): boolean => failed && framed.has(g),
        )
      )
        break;
      // A frame depends on its bracket and the adjacent Hermite slopes:
      // every such interval of every failed frame is opened in one pass.
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
      if (affected.size === 0) break;
      const next: IKnots = on(grid, HumanArmRefine.split(knots, [...affected]));
      const carried: number[][][] = solved.x.map(
        (arm: number[][]): number[][] =>
          next.knots.map((g: number): number[] =>
            HumanArmRefine.hermite(at.context.times, arm, grid.grid[g]!),
          ),
      );
      at = next;
      solved = HumanArmOptimiser.optimise(
        at.context,
        carried,
        solved.penalty,
        grid.fine,
      );
    }
    const played: Admission.IReading =
      !at.context.still && grid.fine.n > at.context.n
        ? {
            x: Knots.read(at.context.times, grid.fine.times, solved.x),
            evaluation: solved.evaluation,
          }
        : Admission.read(at.context, grid.fine, solved.x);
    return { ...at, ...solved, played };
  }

  /**
   * Whether a solve's played trajectory is admitted on the frame grid.
   *
   * @param solved The solve's end.
   * @returns Whether its frame-grid reading is within the tolerance.
   */
  export function met(solved: ISolved): boolean {
    return solved.played.evaluation.worst.value <= M.TOLERANCE;
  }

  /**
   * The refusal of a solve its frame-grid reading does not admit, in the plan's
   * own reading: a path too fast for the speed bound is met by the same path
   * over a longer span (Hollerbach 1984, "Dynamic scaling of manipulator
   * trajectories"), so a `duration` refusal names the span its fastest probe's
   * speed over the bound needs, read at the knots and on the frame grid, and
   * the solution it was reached at is told.
   *
   * @param grid The grid.
   * @param last The unadmitted solve.
   * @param told Where a `duration` refusal's solution is told.
   * @returns The refusal.
   */
  export function refused(
    grid: IGrid,
    last: ISolved,
    told: HumanArmTrajectory.IMirrorTold,
  ): HumanRefusal {
    const at: readonly number[] = last.context.times;
    const n: number = last.context.n;
    const worst: M.IEvaluation["worst"] =
      last.evaluation.worst.value > M.TOLERANCE
        ? last.evaluation.worst
        : last.played.evaluation.worst;
    if (worst.axis === "duration")
      told.state = { times: [...at], x: last.x, penalty: last.penalty };
    return new HumanRefusal({
      kind: "reach",
      axis: worst.axis,
      value: worst.axis === "duration" ? at[n - 1]! - at[0]! : worst.value,
      feasible:
        worst.axis === "duration"
          ? {
              kind: "range",
              minimum: Pace.duration(
                (at[n - 1]! - at[0]!) *
                  Math.max(
                    Pace.slower(last.context, last.x),
                    Pace.slower(grid.fine, last.played.x),
                  ),
              ),
              maximum: null,
              unit: "s",
            }
          : null,
      reason: `no path of the ${last.problem.arms.map((a: HumanArmTrajectory.IArm): string => a.side).join(" and ")} arm over the action keeps the hand on its site, the arm clear and its speed within the law's own pace: ${worst.what}`,
      fix:
        worst.axis === "duration"
          ? "give the action more time"
          : "put the hand on a site its arm reaches with the body clear",
    });
  }

  /**
   * Each arm's trajectory a solve's knots play.
   *
   * @param solved The solve's end.
   * @returns Each arm's reader, in the problem's order, and the solution.
   */
  export function played(solved: ISolved): HumanArmTrajectory.ISolved {
    return {
      trajectories: solved.problem.arms.map(
        (
          _: HumanArmTrajectory.IArm,
          a: number,
        ): ReturnType<typeof HumanArmTrajectoryPlayback> =>
          HumanArmTrajectoryPlayback(
            solved.context.setups,
            solved.context.times,
            solved.x,
            a,
          ),
      ),
      state: {
        times: [...solved.context.times],
        x: solved.x,
        penalty: solved.penalty,
      },
    };
  }

  /**
   * A stretch of a caller's own arm course solved by trajectory optimisation
   * alone: from each arm's given state at the stretch's first instant
   * (`IArm.rest`) to its given state at the last (`IArm.back`), or to its site
   * there where none is given, through the problem's sites and clear of what
   * its bases hold, seeded by each arm's straight interpolation in the
   * optimiser's coordinates between those states (its rest held where the end
   * is open). A caller reaches for it where its closed-form fit loses the
   * admissible swivel it continued; the stretch is one problem, solved once,
   * and refused where its frame-grid reading does not admit it.
   *
   * @param read The stretch's problem on given seconds: its first waypoint's
   *   arms are their `rest`, the last's their `back` where given, every site
   *   the hand's on the stretch.
   * @param times The stretch's first knots' seconds, ascending, its first and
   *   last instants included.
   * @returns Each arm's trajectory, in the problem's order, and the solution.
   * @throws {HumanRefusal} When the solve's frame-grid reading does not admit
   *   it, naming the worst miss.
   */
  export function plan(
    read: Reading,
    times: readonly number[],
  ): HumanArmTrajectory.ISolved {
    const seconds: number[] = Pace.uniform(times[0]!, times[times.length - 1]!);
    const author: HumanArmTrajectory.IProblem = read(seconds);
    const flip: boolean = Mirror.leftFirst(author);
    const reading: Reading = flip
      ? (t: readonly number[]): HumanArmTrajectory.IProblem =>
          Mirror.mirrored(read(t))
      : read;
    const problem: HumanArmTrajectory.IProblem = flip
      ? Mirror.mirrored(author)
      : author;
    const contextOf: ContextOf = HumanArmTrajectoryContext.prepare(
      problem.body,
      problem.arms.map(
        (arm: HumanArmTrajectory.IArm): "left" | "right" => arm.side,
      ),
    );
    const grid: IGrid = {
      reading,
      contextOf,
      grid: seconds,
      fine: contextOf(problem),
    };
    const from: IKnots = on(grid, snap(seconds, times));
    const c: M.IContext = from.context;
    const span: number = c.times[c.n - 1]! - c.times[0]!;
    const seed: number[][][] = c.rest.map(
      (rest: number[], a: number): number[][] =>
        c.times.map((t: number): number[] => {
          const share: number = c.open ? 0 : (t - c.times[0]!) / span;
          return rest.map(
            (v: number, d: number): number => v + (c.back[a]![d]! - v) * share,
          );
        }),
    );
    const solved: ISolved = optimise(grid, from, seed);
    if (met(solved)) return played(solved);
    const refusal: HumanRefusal = refused(grid, solved, { flip });
    throw flip ? Mirror.refusal(refusal) : refusal;
  }
}

/**
 * The most refinement passes a stretch takes over its frame grid's failing
 * intervals: four halvings bring a knot interval of sixteen frames to single
 * frames (provisional).
 */
const REFINEMENTS: number = 4;

/**
 * The share of the worst miss a refinement pass must cut to earn the next one;
 * a pass that cuts less has stopped paying, and the course is read as it stands
 * (provisional).
 */
const PROGRESS: number = 0.1;
