import type { AutoMovieHumanSide } from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmOptimiser } from "./HumanArmOptimiser";
import { HumanArmRefine } from "./HumanArmRefine";
import { HumanArmSeed } from "./HumanArmSeed";
import type { HumanArmTrajectory } from "./HumanArmTrajectory";
import type { HumanArmTrajectoryAdmission as Admission } from "./HumanArmTrajectoryAdmission";
import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import { HumanArmTrajectoryKnots as Knots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryMirror as Mirror } from "./HumanArmTrajectoryMirror";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPace as Pace } from "./HumanArmTrajectoryPace";
import { HumanArmTrajectoryPlayback } from "./HumanArmTrajectoryPlayback";

/**
 * One stretch of an arm course solved by trajectory optimisation alone:
 * TrajOpt's penalty sequential convex optimisation on a few knots (Schulman et
 * al. 2014, Algorithm 1, `HumanArmOptimiser`), whose own reading of the knots
 * and the intervals between them admits or refuses the path played, knots added
 * only where the course between them fails, with no other start tried. It is
 * the solve `planHumanArmTrajectory` runs on a stretch its laid course fails or
 * on a whole span, and the solve a caller runs on a stretch of its own course
 * where the arm's closed-form fit loses its admissible swivel (`plan`).
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

    /** Each arm's velocity and acceleration at each knot, the optimiser's. */
    rates?: Knots.IRates;

    /** Exact hold positions carried through refinement and pacing. */
    pinned?: HumanArmSeed.IHolds;

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
   * The knots' trajectory solved from a seed, and solved again only where the
   * knots are too few for the course between them.
   *
   * The knots stay few, TrajOpt's few timesteps: a moving site is held at every
   * frame through the knots' interpolant, which the optimiser reads and
   * linearises on the whole grid (`HumanArmTrajectoryKnots`), and the clearance
   * is read at the knots and through every frame between them
   * (`HumanArmTrajectoryEvaluate`), so the solve's own last reading admits or
   * refuses the path played at every instant. Where that reading fails on the
   * course between knots (a swept reading, or any term at a frame strictly
   * between two knots), the knots lack the freedom to route the course there:
   * each such interval is split at its middle frame, and the path is solved on,
   * warm, from its own solution carried onto the knots
   * (`HumanArmRefine.hermite`) at the penalty it reached, every other interval
   * as it was (trajopt subdivides only the interval its longest valid segment
   * exceeds; Schulman et al. 2013, section V). A failure at the knots
   * themselves is the problem's, and no knot is added for it. Each pass halves
   * the intervals it splits and an interval of one frame is never split, so the
   * passes are at most the base-two logarithm of the longest interval's
   * frames.
   *
   * @param grid The grid.
   * @param from The knots the seed stands on.
   * @param seed Each arm's coordinates at each knot.
   * @param penalty The penalty to start at; the optimiser's own when absent.
   * @param pinned The solved hold poses. If present, each new hold knot is also
   *   solved before its position is fixed.
   * @returns The solve's end, on the knots it ended on.
   */
  export function optimise(
    grid: IGrid,
    from: IKnots,
    seed: number[][][],
    penalty?: number,
    pinned?: HumanArmSeed.IHolds,
  ): ISolved {
    let at: IKnots = from;
    let solved: ReturnType<typeof HumanArmOptimiser.optimise> =
      HumanArmOptimiser.optimise(
        at.context,
        seed,
        penalty,
        grid.fine,
        undefined,
        pinned,
      );
    let played: Admission.IReading;
    for (;;) {
      const knotted: boolean = !at.context.still && grid.fine.n > at.context.n;
      const x: number[][][] = knotted
        ? Knots.read(at.context.times, grid.fine.times, solved.x, solved.rates)
        : solved.x;
      // The SQP reads contact pairs only at its knots. Certify the candidate's
      // point and reverse-corner contacts before admitting it or attributing
      // the refusal only to its pace.
      const evaluation: M.IEvaluation =
        knotted && solved.evaluation.placement.value <= M.TOLERANCE
          ? M.evaluate(grid.fine, x)
          : solved.evaluation;
      played = { x, evaluation };
      if (!knotted || evaluation.worst.value <= M.TOLERANCE) break;
      const knots: number[] = at.knots;
      // Each interval whose course fails between its knots past the
      // tolerance: one of whose sweeps fails (the reading keeps an
      // interval's sweeps by its first knot), or one with a failing frame
      // strictly inside it. One of a single frame cannot be split.
      const affected: Set<number> = new Set();
      knots.forEach((g: number, i: number): void => {
        if (i + 1 >= knots.length || knots[i + 1]! - g < 2) return;
        for (const arm of evaluation.swept)
          for (const sweep of arm[g] ?? [])
            if (1000 * (sweep.lower - sweep.clear) > M.TOLERANCE)
              affected.add(i);
        for (let h: number = g + 1; h < knots[i + 1]!; ++h)
          if (evaluation.failing[h]) affected.add(i);
      });
      if (affected.size === 0) break;
      const next: IKnots = on(grid, HumanArmRefine.split(knots, [...affected]));
      // The solution carried onto the new knots: each new knot's position,
      // velocity and acceleration read on the old knots' quintics, so the
      // course the solve continues from is the one it ended on.
      const before: readonly number[] = at.context.times;
      const rates: Knots.IRates | undefined = solved.rates;
      const read = (arm: number[][], a: number, g: number): number[][] =>
        rates === undefined
          ? [HumanArmRefine.hermite(before, arm, grid.grid[g]!)]
          : Knots.at(
              before,
              arm,
              rates.velocities[a]!,
              rates.accelerations[a]!,
              grid.grid[g]!,
            );
      const values: number[][][][] = solved.x.map(
        (arm: number[][], a: number): number[][][] =>
          next.knots.map((g: number): number[][] => read(arm, a, g)),
      );
      const carried: number[][][] = values.map(
        (arm: number[][][]): number[][] =>
          arm.map((v: number[][]): number[] => v[0]!),
      );
      at = next;
      if (pinned !== undefined)
        pinned = HumanArmSeed.holds(at.problem, at.context, carried, pinned);
      solved = HumanArmOptimiser.optimise(
        at.context,
        carried,
        solved.penalty,
        grid.fine,
        rates === undefined
          ? undefined
          : {
              velocities: values.map((arm: number[][][]): number[][] =>
                arm.map((v: number[][]): number[] => v[1]!),
              ),
              accelerations: values.map((arm: number[][][]): number[][] =>
                arm.map((v: number[][]): number[] => v[2]!),
              ),
            },
        pinned,
      );
    }
    return {
      ...at,
      ...solved,
      played,
      ...(pinned === undefined ? {} : { pinned }),
    };
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
   * own reading. A path that breaks anything but its speed (`placement`) is
   * refused for that: no longer span meets it. A path that breaks only its
   * speed is met by the same path over a longer span (Hollerbach 1984, "Dynamic
   * scaling of manipulator trajectories"), so its `duration` refusal names the
   * span its fastest probe's speed over the bound needs, read at the knots and
   * on the frame grid, and the solution it was reached at is told.
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
    const span: number = at[n - 1]! - at[0]!;
    const reading: M.IEvaluation = last.played.evaluation;
    const worst: M.IWorst =
      reading.placement.value > M.TOLERANCE ? reading.placement : reading.worst;
    const arms: string = last.problem.arms
      .map((a: HumanArmTrajectory.IArm): string => a.side)
      .join(" and ");
    if (worst.axis !== "duration")
      return new HumanRefusal({
        kind: "reach",
        axis: worst.axis,
        value: worst.value,
        feasible: null,
        reason: `no path of the ${arms} arm over the action keeps the hand on its site, the arm clear and its speed within the law's own pace: ${worst.what}`,
        fix: "put the hand on a site its arm reaches with the body clear",
      });
    told.state = { times: [...at], x: last.x, penalty: last.penalty };
    return new HumanRefusal({
      kind: "reach",
      axis: "duration",
      value: span,
      feasible: {
        kind: "range",
        minimum: Pace.duration(
          span *
            Math.max(
              Pace.slower(last.context, last.x),
              Pace.slower(grid.fine, last.played.x),
            ),
        ),
        maximum: null,
        unit: "s",
      },
      reason: `no path of the ${arms} arm over the action keeps the hand on its site, the arm clear and its speed within the law's own pace: ${worst.what}`,
      fix: "give the action more time",
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
            solved.rates,
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
        (arm: HumanArmTrajectory.IArm): AutoMovieHumanSide => arm.side,
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
