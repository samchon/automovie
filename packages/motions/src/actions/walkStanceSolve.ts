import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanQuadraticProgram, IAutoMovieMotionHumanSequentialConvex, IAutoMovieMotionHumanWalkStanceCourse, IAutoMovieMotionHumanWalkStanceSolve } from "@automovie/interface";

import { HumanQuadraticProgram as Q } from "../posture/HumanQuadraticProgram";
import { HumanSequentialConvex as SCO } from "../posture/HumanSequentialConvex";
import { walkStanceCourse } from "./walkStanceCourse";
import { walkStanceTerms } from "./walkStanceTerms";
import { walkStanceModel } from "./walkStanceModel";

/**
 * A stance course's problem and its solve (`walkStanceCourse`): the problem
 * over a take's knots, the shared sequential convex loop over it
 * (`HumanSequentialConvex`, TrajOpt's outer loop), and the course recorded
 * at its last iterate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is solved and who reads it.
 * @evidence contracts/development/design.md#principled-representation The solve apart from the record it produces and the model it solves.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The solve, the loop, the problem and the record, read by the takes and their tests.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The schedule and the penalties are `walkStanceTerms`'.
 */
export namespace walkStanceSolve {
  /**
   * Solve a take's stance course.
   *
   * A course whose first knots are settled, `from` of them as `start` holds
   * them, is solved over the rest alone, from two knots before them, those
   * two held, so its second differences run on across the join: a receding
   * horizon with a two-knot overlap. It is not the whole problem's solution,
   * in which a later knot could still pull the earlier ones through the
   * shared costs and constraints; a caller that holds knots states how far it
   * holds them and checks the result against the whole solve.
   *
   * @param body The body.
   * @param knots The knots, evenly spaced; one knot alone is a posture.
   * @param start A course of the same take's first knots to start from, where a nearly equal course was solved before; flat and upright when absent.
   * @param from How many of the first knots `start` settles; none when absent.
   * @returns The course.
   */
  export function solve(
    body: IAutoMovieMotionHumanBody,
    knots: readonly IAutoMovieMotionHumanWalkStanceCourse.IKnot[],
    start?: IAutoMovieMotionHumanWalkStanceCourse.ICourse,
    from: number = 0,
  ): IAutoMovieMotionHumanWalkStanceCourse.ICourse {
    return optimise(body, problem(body, knots, start, from));
  }

  /**
   * A course's problem solved by the shared sequential convex loop
   * (`HumanSequentialConvex`, TrajOpt's outer loop, Schulman et al. 2014)
   * under the body's schedule (`schedule`) and `ROUNDS`, its penalty steered
   * at every iterate from `PENALTY` (`HumanSequentialConvex.IOptions.steer`),
   * so the objective does not pull a course off its constraints: each
   * convex subproblem, the problem's own with any rows the caller adds, is
   * solved within the region by `HumanQuadraticProgram`, warm-started across
   * the region's shrinking and from the multipliers of the last step taken,
   * and a step is predicted to lower the merit by what it lowers the
   * subproblem's value, its Gauss-Newton cost and its soft rows' l1 excess.
   *
   * @param body The body.
   * @param shape The problem at the start, whose variables, region and steps every course shares.
   * @param at The problem a course is evaluated by, and, about a course whose subproblem is built (`model`), the problem convexified there and the rows added to it; `shape` with none when absent.
   * @returns The course at the last iterate taken, its largest excess as `unmet`.
   */
  export function optimise(
    body: IAutoMovieMotionHumanBody,
    shape: IAutoMovieMotionHumanWalkStanceCourse.IProblem,
    at: IAutoMovieMotionHumanWalkStanceSolve.IOptimiseAt = (): {
      problem: IAutoMovieMotionHumanWalkStanceCourse.IProblem;
      rows: IAutoMovieMotionHumanQuadraticProgram.IRow[];
    } => ({ problem: shape, rows: [] }),
  ): IAutoMovieMotionHumanWalkStanceCourse.ICourse {
    // The multipliers of the last step taken, which the next subproblem
    // starts from.
    let duals: Map<string, number> | undefined;

    // The last step solved, its model and region, which a correction of it reads.
    let last:
      | {
          x: Float64Array;
          model: IAutoMovieMotionHumanQuadraticProgram.IProblem;
          rows: number;
          mu: number;
          radius: number;
          step: Float64Array;
        }
      | undefined;
    const problem: IAutoMovieMotionHumanSequentialConvex.IProblem<Float64Array, IAutoMovieMotionHumanWalkStanceCourse.IEvaluation> = {
      evaluate: (x: Float64Array): IAutoMovieMotionHumanWalkStanceCourse.IEvaluation => {
        return at(x, false).problem.evaluate(x);
      },
      feasible: (evaluation: IAutoMovieMotionHumanWalkStanceCourse.IEvaluation): boolean =>
        evaluation.worst <= shape.tolerance,
      convexify: (
        x: Float64Array,
        _evaluation: IAutoMovieMotionHumanWalkStanceCourse.IEvaluation,
        mu: number,
        _radius: number,
        objective: boolean,
      ): IAutoMovieMotionHumanSequentialConvex.IModel<Float64Array> => {
        const about: { problem: IAutoMovieMotionHumanWalkStanceCourse.IProblem; rows: IAutoMovieMotionHumanQuadraticProgram.IRow[] } = at(x, true);
        const convex: IAutoMovieMotionHumanQuadraticProgram.IProblem = about.problem.convexify(x, mu, objective);
        const model: IAutoMovieMotionHumanQuadraticProgram.IProblem = {
          ...convex,
          rows: [...convex.rows, ...about.rows],
        };
        const zero: number = Q.value(model, new Float64Array(model.n));
        let trusted: IAutoMovieMotionHumanQuadraticProgram.IProblem | undefined;
        let warm: IAutoMovieMotionHumanQuadraticProgram.IState | undefined;
        return {
          solve: (radius: number): IAutoMovieMotionHumanSequentialConvex.IStep<Float64Array> => {
            trusted = {
              ...model,
              rows: [...model.rows, ...shape.region(x, radius)],
            };
            warm = Q.solve(trusted, warm, duals);
            last = {
              x,
              model,
              rows: convex.rows.length,
              mu,
              radius,
              step: warm.x,
            };
            const length: number = shape.length(warm.x);
            // The soft rows' linearised excess at the step, in their own
            // degrees, the violation the steering reads.
            let violation: number = 0;
            let worst: number = 0;
            for (const row of model.rows) {
              if (row.weight === undefined) continue;
              let value: number = 0;
              for (let r: number = 0; r < row.index.length; r++)
                value += row.coef[r]! * warm.x[row.index[r]!]!;
              const over: number = Math.max(row.l - value, value - row.u, 0);
              violation += over;
              worst = Math.max(worst, over);
            }
            return {
              trial: shape.stepped(x, warm.x),
              predicted: zero - Q.value(model, warm.x),
              violation,
              met: worst <= shape.tolerance,
              length,
              // The step at the region's edge, to the solver's own accuracy.
              full: length >= radius * (1 - Q.TOLERANCE),
            };
          },
          taken: (): void => {
            duals = Q.multipliers(trusted!, warm!);
          },
        };
      },

      // The second-order correction of a rejected step (Nocedal and Wright
      // 2006, section 15.6, (15.36); `HumanSequentialConvex.IProblem.correct`):
      // each row's linearisation error at the trial, e = g(trial) - (g(x) +
      // a d), is taken off its bounds, and the subproblem at `x` is solved
      // again within the same region, so the step lands where the rows'
      // second-order miss is met. A row's error is read from the rows
      // linearised at the trial, which list the same constraints in the same
      // order: there its bounds are L - g(trial), U - g(trial), so
      // g(trial) - g(x) is the difference of whichever bound is finite; a
      // row bounded on neither side has no error to correct.
      correct: (
        x: Float64Array,
        step: IAutoMovieMotionHumanSequentialConvex.IStep<Float64Array>,
      ): Float64Array | null => {
        if (last === undefined || last.x !== x) return null;
        const there: IAutoMovieMotionHumanQuadraticProgram.IProblem = at(step.trial, true).problem.convexify(
          step.trial,
          last.mu,
          true,
        );
        // The same constraints in the same order, or no correction.
        if (there.rows.length !== last.rows) return null;
        const d: Float64Array = last.step;
        const rows: IAutoMovieMotionHumanQuadraticProgram.IRow[] = last.model.rows.map(
          (row: IAutoMovieMotionHumanQuadraticProgram.IRow, i: number): IAutoMovieMotionHumanQuadraticProgram.IRow => {
            if (i >= there.rows.length) return row;
            let predicted: number = 0;
            for (let r: number = 0; r < row.index.length; r++)
              predicted += row.coef[r]! * d[row.index[r]!]!;
            const linearised: IAutoMovieMotionHumanQuadraticProgram.IRow = there.rows[i]!;
            const moved: number | null = Number.isFinite(row.l)
              ? row.l - linearised.l
              : Number.isFinite(row.u)
                ? row.u - linearised.u
                : null;
            if (moved === null) return row;
            const error: number = moved - predicted;
            return { ...row, l: row.l - error, u: row.u - error };
          },
        );
        const corrected: IAutoMovieMotionHumanQuadraticProgram.IState = Q.solve({
          ...last.model,
          rows: [...rows, ...shape.region(x, last.radius)],
        });
        return shape.stepped(x, corrected.x);
      },
    };
    const solved: IAutoMovieMotionHumanSequentialConvex.IResult<Float64Array, IAutoMovieMotionHumanWalkStanceCourse.IEvaluation> = SCO.minimise(
      problem,
      shape.start,
      {
        schedule: walkStanceTerms.schedule(body),
        penalties: [walkStanceTerms.PENALTY],
        rounds: walkStanceTerms.ROUNDS,
        steer: true,
      },
    );
    return at(solved.x, false).problem.course(
      solved.x,
      solved.evaluation.worst,
    );
  }

  /** A course's knots from `join` on. */
  function cut(start: IAutoMovieMotionHumanWalkStanceCourse.ICourse, join: number): IAutoMovieMotionHumanWalkStanceCourse.ICourse {
    const rest = (series: Float64Array): Float64Array => series.slice(join);
    return {
      knots: start.knots.slice(join),
      drop: rest(start.drop),
      pitch: { left: rest(start.pitch.left), right: rest(start.pitch.right) },
      trunk: { pitch: rest(start.trunk.pitch), roll: rest(start.trunk.roll) },
      turn: { left: rest(start.turn.left), right: rest(start.turn.right) },
      slide: {
        left: { x: rest(start.slide.left.x), z: rest(start.slide.left.z) },
        right: { x: rest(start.slide.right.x), z: rest(start.slide.right.z) },
      },
      unmet: start.unmet,
      planted: start.planted.slice(join),
    };
  }

  /** A course's first `join` knots followed by a tail solved from there. */
  function joined(
    knots: readonly IAutoMovieMotionHumanWalkStanceCourse.IKnot[],
    start: IAutoMovieMotionHumanWalkStanceCourse.ICourse,
    join: number,
    tail: IAutoMovieMotionHumanWalkStanceCourse.ICourse,
  ): IAutoMovieMotionHumanWalkStanceCourse.ICourse {
    const series = (head: Float64Array, rest: Float64Array): Float64Array => {
      const out: Float64Array = new Float64Array(knots.length);
      out.set(head.subarray(0, join));
      out.set(rest, join);
      return out;
    };
    return {
      knots,
      drop: series(start.drop, tail.drop),
      pitch: {
        left: series(start.pitch.left, tail.pitch.left),
        right: series(start.pitch.right, tail.pitch.right),
      },
      trunk: {
        pitch: series(start.trunk.pitch, tail.trunk.pitch),
        roll: series(start.trunk.roll, tail.trunk.roll),
      },
      turn: {
        left: series(start.turn.left, tail.turn.left),
        right: series(start.turn.right, tail.turn.right),
      },
      slide: {
        left: {
          x: series(start.slide.left.x, tail.slide.left.x),
          z: series(start.slide.left.z, tail.slide.left.z),
        },
        right: {
          x: series(start.slide.right.x, tail.slide.right.x),
          z: series(start.slide.right.z, tail.slide.right.z),
        },
      },
      unmet: tail.unmet,
      planted: [...start.planted.slice(0, join), ...tail.planted],
    };
  }

  /** A course's record at its variables. */
  export function record(
    knots: readonly IAutoMovieMotionHumanWalkStanceCourse.IKnot[],
    n: number,
    x: Float64Array,
    unmet: number,
    read: IAutoMovieMotionHumanWalkStanceSolve.IRecordRead,
  ): IAutoMovieMotionHumanWalkStanceCourse.ICourse {
    const series = (slot: number): Float64Array =>
      Float64Array.from(
        { length: n },
        (_: unknown, k: number): number => x[walkStanceTerms.WIDTH * k + slot]!,
      );
    return {
      knots,
      drop: series(0),
      pitch: { left: series(1), right: series(2) },
      trunk: { pitch: series(3), roll: series(4) },
      turn: { left: series(5), right: series(6) },
      slide: {
        left: { x: series(7), z: series(8) },
        right: { x: series(9), z: series(10) },
      },
      unmet,
      planted: knots.map((knot: IAutoMovieMotionHumanWalkStanceCourse.IKnot, k: number): IAutoMovieMotionHumanWalkStanceCourse.IPlanted[] =>
        knot.stances.map(
          (_: IAutoMovieMotionHumanWalkStanceCourse.IStance, j: number): IAutoMovieMotionHumanWalkStanceCourse.IPlanted => read(x, k, j).planted,
        ),
      ),
    };
  }

  /**
   * A course's problem (`IProblem`).
   *
   * @param body The body.
   * @param knots The knots, evenly spaced.
   * @param start A course of the same take's first knots to start from.
   * @param from How many of the first knots `start` settles; none when absent.
   * @returns The problem.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the windowing.
   * @evidence contracts/development/implementation.md#principled-implementation TrajOpt's convex subproblem: the cost's Gauss-Newton model and the constraints as exact l1 penalties of their linearisations, the linear rows hard.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The window, the build, then four closures over it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every constraint the course reads is a row.
   * @evidence contracts/development/implementation.md#efficient-algorithms One sweep per evaluation or subproblem, its gradients only for the subproblem.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the course's build and record.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the build in its closures only.
   */
  export function problem(
    body: IAutoMovieMotionHumanBody,
    knots: readonly IAutoMovieMotionHumanWalkStanceCourse.IKnot[],
    start?: IAutoMovieMotionHumanWalkStanceCourse.ICourse,
    from: number = 0,
  ): IAutoMovieMotionHumanWalkStanceCourse.IProblem {
    const windowed: boolean =
      start !== undefined && from >= 2 && from <= start.knots.length;
    const join: number = windowed ? from - 2 : 0;
    const tail: readonly IAutoMovieMotionHumanWalkStanceCourse.IKnot[] = windowed ? knots.slice(join) : knots;
    const built = walkStanceModel.of(
      body,
      tail,
      windowed ? cut(start!, join) : start,
      windowed ? 2 : 0,
    );
    const size: number = built.size;
    return {
      start: Float64Array.from(built.x),
      evaluate: (x: Float64Array): IAutoMovieMotionHumanWalkStanceCourse.IEvaluation => {
        let objective: number = 0;
        let violation: number = 0;
        let worst: number = 0;
        built.sweep(
          x,
          false,
          (r: number): void => {
            objective += (r * r) / 2;
          },
          (over: number): void => {
            violation += Math.max(0, over);
            worst = Math.max(worst, over);
          },
        );
        return { objective, violation, worst };
      },
      convexify: (
        x: Float64Array,
        mu: number,
        objective: boolean = true,
      ): IAutoMovieMotionHumanQuadraticProgram.IProblem => {
        const p: Float64Array[] = Array.from(
          { length: size },
          (): Float64Array => new Float64Array(walkStanceTerms.BAND + 1),
        );
        const q: Float64Array = new Float64Array(size);
        const rows: IAutoMovieMotionHumanQuadraticProgram.IRow[] = [];
        built.sweep(
          x,
          true,
          (r: number, idx: number[], g: number[]): void => {
            if (!objective) return;
            for (let a: number = 0; a < idx.length; a++) {
              q[idx[a]!]! += r * g[a]!;
              for (let b: number = 0; b < idx.length; b++)
                if (idx[a]! <= idx[b]!)
                  p[idx[a]!]![idx[b]! - idx[a]!]! += g[a]! * g[b]!;
            }
          },
          (over: number, idx: number[], g: () => number[]): void => {
            rows.push({
              key: `c|${rows.length}`,
              index: idx,
              coef: g(),
              l: -Infinity,
              u: -over,
              weight: mu,
            });
          },
        );
        // Each variable gets a whisker of curvature so the step's system is
        // definite where a residual leaves a variable free.
        for (let i: number = 0; i < size; i++) p[i]![0]! += 1e-9;
        return {
          n: size,
          band: walkStanceTerms.BAND,
          p,
          q,
          rows,
        };
      },
      region: (x: Float64Array, radius: number): IAutoMovieMotionHumanQuadraticProgram.IRow[] =>
        built.bounds(x, radius),
      length: (step: Float64Array): number => {
        let longest: number = 0;
        for (let i: number = 0; i < step.length; i++)
          longest = Math.max(longest, Math.abs(step[i]!) / walkStanceTerms.UNIT[i % walkStanceTerms.WIDTH]!);
        return longest;
      },
      stepped: (x: Float64Array, step: Float64Array): Float64Array =>
        x.map((v: number, i: number): number => v + step[i]!),
      tolerance: walkStanceCourse.MET,
      course: (x: Float64Array, unmet: number): IAutoMovieMotionHumanWalkStanceCourse.ICourse => {
        const solved: IAutoMovieMotionHumanWalkStanceCourse.ICourse = record(tail, built.n, x, unmet, built.read);
        return windowed ? joined(knots, start!, join, solved) : solved;
      },
      planted: (x: Float64Array, knot: number): IAutoMovieMotionHumanWalkStanceCourse.IPlanted[] =>
        knot < join + (windowed ? 2 : 0)
          ? []
          : tail[knot - join]!.stances.map(
              (_: IAutoMovieMotionHumanWalkStanceCourse.IStance, j: number): IAutoMovieMotionHumanWalkStanceCourse.IPlanted =>
                built.read(x, knot - join, j).planted,
            ),
      variables: (knot: number, side: "left" | "right"): number[] =>
        walkStanceTerms.variables(knot - join, side),
      first: join + (windowed ? 2 : 0),
    };
  }

}
