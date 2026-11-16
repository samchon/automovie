

import type { IHumanBody } from "../body/IHumanBody";
import { HumanQuadraticProgram as Q } from "../posture/HumanQuadraticProgram";
import { HumanSequentialConvex as SCO } from "../posture/HumanSequentialConvex";
import { walkStanceCourse } from "./walkStanceCourse";
import { walkStanceTerms } from "./walkStanceTerms";
import { walkStanceModel } from "./walkStanceModel";
import { walkStanceConvexify } from "./walkStanceConvexify";

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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States body/knots, optional same-take continuation and the two-held-knot receding horizon.
   * @evidence contracts/development/implementation.md#principled-implementation Builds the original stance problem and runs its shared penalty sequential-convex solve with the unchanged two-knot acceleration overlap.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One problem builder and one optimizer own the model and solver responsibilities separately.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the stated settled prefix and reports the optimizer's actual remaining excess without changing contact or feasibility policy.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparation is linear in the retained knot window; derivative and QP costs belong to the optimizer, and held prefix knots are not solved again.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the caller's stated same-take continuation only; every new problem owns its geometry, derivative record and solve lifetime.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The temporary problem releases after the optimizer returns or throws; the returned course belongs to its caller.
   */
  export function solve(
    body: IHumanBody,
    knots: readonly walkStanceCourse.IKnot[],
    start?: walkStanceCourse.ICourse,
    from: number = 0,
  ): walkStanceCourse.ICourse {
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes penalty steering, trust-region warm starts, model merit, second-order correction and reported excess.
   * @evidence contracts/development/implementation.md#principled-implementation Retains the original TrajOpt outer loop, exact l1 constraint merit, keyed multiplier warm start and Nocedal-Wright second-order bound correction under the same schedule and stopping thresholds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The course problem owns physical evaluations, HumanSequentialConvex owns acceptance and steering, and a prepared quadratic model owns each fixed P/q/A convexification's numeric solves.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps all original QP calls, warm/cold choices, penalties, attempts and tolerance tests; preparation shares numeric prerequisites only while changing row intervals remain explicit solve inputs.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each convexification prepares fixed matrices once across radius retries and its bound-only corrections. Model value and soft-row violation share one ordered row-product pass; the finite origin avoids a zero-vector scan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed variable layout, ordered A rows and P/q are shared only within one convex model; each new linearization prepares afresh, warm iterates follow the original radius path, and corrections remain cold.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous solve retains current multipliers, last-step metadata and active prepared-model state, each bounded by its course dimensions; model closures and numeric scratch release with the solve and no history or global cache is added.
   */
  export function optimise(
    body: IHumanBody,
    shape: walkStanceCourse.IProblem,
    at: (
      x: Float64Array,
      model: boolean,
    ) => { problem: walkStanceCourse.IProblem; rows: Q.IRow[] } = (): {
      problem: walkStanceCourse.IProblem;
      rows: Q.IRow[];
    } => ({ problem: shape, rows: [] }),
  ): walkStanceCourse.ICourse {
    // The multipliers of the last step taken, which the next subproblem
    // starts from.
    let duals: Map<string, number> | undefined;

    // The last step solved, its model and region, which a correction of it reads.
    let last:
      | {
          x: Float64Array;
          model: Q.IProblem;
          rows: number;
          mu: number;
          radius: number;
          step: Float64Array;
          prepared: ReturnType<typeof Q.prepare>;
        }
      | undefined;
    const problem: SCO.IProblem<Float64Array, walkStanceCourse.IEvaluation> = {
      evaluate: (x: Float64Array): walkStanceCourse.IEvaluation => {
        return at(x, false).problem.evaluate(x);
      },
      feasible: (evaluation: walkStanceCourse.IEvaluation): boolean =>
        evaluation.worst <= shape.tolerance,
      convexify: (
        x: Float64Array,
        _evaluation: walkStanceCourse.IEvaluation,
        mu: number,
        _radius: number,
        objective: boolean,
      ): SCO.IModel<Float64Array> => {
        const about: { problem: walkStanceCourse.IProblem; rows: Q.IRow[] } = at(x, true);
        const convex: Q.IProblem = about.problem.convexify(x, mu, objective);
        const model: Q.IProblem = {
          ...convex,
          rows: [...convex.rows, ...about.rows],
        };
        const zero: number = Q.value(model);
        let trusted: Q.IProblem | undefined;
        let prepared: ReturnType<typeof Q.prepare> | undefined;
        let warm: Q.IState | undefined;
        return {
          solve: (radius: number): SCO.IStep<Float64Array> => {
            trusted = {
              ...model,
              rows: [...model.rows, ...shape.region(x, radius)],
            };
            // Radius changes alter the bounds alone; P, q and every row's
            // coefficients belong to this one convexification.
            prepared ??= Q.prepare(trusted);
            warm = prepared.solve(trusted.rows, warm, duals);
            last = {
              x,
              model,
              rows: convex.rows.length,
              mu,
              radius,
              step: warm.x,
              prepared,
            };
            const length: number = shape.length(warm.x);
            // The soft rows' linearised excess at the step, in their own
            // degrees, the violation the steering reads.
            let violation: number = 0;
            let worst: number = 0;
            const value: number = Q.value(model, warm.x, (_row: Q.IRow, over: number): void => {
              violation += over;
              worst = Math.max(worst, over);
            });
            const delta: Float64Array = warm.x;
            let trial: Float64Array | undefined;
            return {
              // Steering compares scalar diagnostics before choosing a model;
              // only a proposal actually evaluated needs its course vector.
              get trial(): Float64Array {
                return (trial ??= shape.stepped(x, delta));
              },
              predicted: zero - value,
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
        step: SCO.IStep<Float64Array>,
      ): Float64Array | null => {
        if (last === undefined || last.x !== x) return null;
        const there: Q.IProblem = at(step.trial, true).problem.convexify(
          step.trial,
          last.mu,
          true,
        );
        // The same constraints in the same order, or no correction.
        if (there.rows.length !== last.rows) return null;
        const d: Float64Array = last.step;
        const rows: Q.IRow[] = last.model.rows.map(
          (row: Q.IRow, i: number): Q.IRow => {
            if (i >= there.rows.length) return row;
            let predicted: number = 0;
            for (let r: number = 0; r < row.index.length; r++)
              predicted += row.coef[r]! * d[row.index[r]!]!;
            const linearised: Q.IRow = there.rows[i]!;
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
        const corrected: Q.IState = last.prepared.solve([
          ...rows,
          ...shape.region(x, last.radius),
        ]);
        return shape.stepped(x, corrected.x);
      },
    };
    const solved: SCO.IResult<Float64Array, walkStanceCourse.IEvaluation> = SCO.minimise(
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
  function cut(start: walkStanceCourse.ICourse, join: number): walkStanceCourse.ICourse {
    const rest: (series: Float64Array) => Float64Array = (series: Float64Array): Float64Array => series.slice(join);
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
    knots: readonly walkStanceCourse.IKnot[],
    start: walkStanceCourse.ICourse,
    join: number,
    tail: walkStanceCourse.ICourse,
  ): walkStanceCourse.ICourse {
    const series: (head: Float64Array, rest: Float64Array) => Float64Array = (head: Float64Array, rest: Float64Array): Float64Array => {
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

  /**
   * Record the original coordinate series and planted goals at a course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that coordinates and goal inputs are copied from one supplied course vector under its original knot order.
   * @evidence contracts/development/implementation.md#principled-implementation Deinterleaves every WIDTH coordinate series and reads each scheduled stance's physical goals at the exact supplied vector, preserving the optimizer's unmet value.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One slot reader constructs all original typed series and one ordered knot/stance map records the planted goals.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Records the actual variables and remaining excess with no fit, interpolation or substituted stance result.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(n*WIDTH+s) output work for n knots and s stances; the supplied planted-only reader avoids posing legs whose constraint values the record never uses.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the problem's existing goal construction while each scalar series owns its own array; no record is cached across solved vectors.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The caller owns returned arrays/goal records and the original readonly knot references; the function retains no extra state.
   */
  export function record(
    knots: readonly walkStanceCourse.IKnot[],
    n: number,
    x: Float64Array,
    unmet: number,
    read: (x: Float64Array, k: number, j: number) => { planted: walkStanceCourse.IPlanted },
  ): walkStanceCourse.ICourse {
    const series: (slot: number) => Float64Array = (slot: number): Float64Array =>
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
      planted: knots.map((knot: walkStanceCourse.IKnot, k: number): walkStanceCourse.IPlanted[] =>
        knot.stances.map(
          (_: walkStanceCourse.IStance, j: number): walkStanceCourse.IPlanted => read(x, k, j).planted,
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
   * @evidence contracts/development/implementation.md#efficient-algorithms One sweep per merit evaluation or new course/swivel linearization; steering penalties and restoration share the latter's derivatives, while prepared row topology serves radius reads.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses one fixed-window geometry, goal-only reader, row preparation and latest exact scalar/swivel derivative record; each returned QP owns fresh matrices and row arrays.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The problem owns its fixed window/build and one bounded numeric derivative record until release, all linear in knot count for fixed bandwidth and foot geometry; it keeps no query history.
   */
  export function problem(
    body: IHumanBody,
    knots: readonly walkStanceCourse.IKnot[],
    start?: walkStanceCourse.ICourse,
    from: number = 0,
  ): walkStanceCourse.IProblem {
    const windowed: boolean =
      start !== undefined && from >= 2 && from <= start.knots.length;
    const join: number = windowed ? from - 2 : 0;
    const tail: readonly walkStanceCourse.IKnot[] = windowed ? knots.slice(join) : knots;
    const built: ReturnType<typeof walkStanceModel.of> = walkStanceModel.of(
      body,
      tail,
      windowed ? cut(start!, join) : start,
      windowed ? 2 : 0,
    );
    const size: number = built.size;
    return {
      start: Float64Array.from(built.x),
      evaluate: (x: Float64Array): walkStanceCourse.IEvaluation => {
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
      convexify: walkStanceConvexify(tail, size, built.sweep),
      region: (x: Float64Array, radius: number): Q.IRow[] =>
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
      course: (x: Float64Array, unmet: number): walkStanceCourse.ICourse => {
        const solved: walkStanceCourse.ICourse = record(
          tail,
          built.n,
          x,
          unmet,
          (values: Float64Array, k: number, j: number): { planted: walkStanceCourse.IPlanted } => ({
            planted: built.planted(values, k, j),
          }),
        );
        return windowed ? joined(knots, start!, join, solved) : solved;
      },
      planted: (x: Float64Array, knot: number, side?: "left" | "right"): walkStanceCourse.IPlanted[] =>
        knot < join + (windowed ? 2 : 0)
          ? []
          : tail[knot - join]!.stances.flatMap(
              (stance: walkStanceCourse.IStance, j: number): walkStanceCourse.IPlanted[] =>
                side !== undefined && stance.side !== side
                  ? []
                  : [built.planted(x, knot - join, j)],
            ),
      variables: (knot: number, side: "left" | "right"): number[] =>
        walkStanceTerms.variables(knot - join, side),
      first: join + (windowed ? 2 : 0),
    };
  }

}
