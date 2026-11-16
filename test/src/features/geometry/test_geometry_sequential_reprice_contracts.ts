import { HumanSequentialConvex as SCO } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Same-linearization repricing changes the exact penalty while preserving
 * actual subproblem solves, feasibility steering and acceptance ownership.
 *
 * Scenarios:
 * 1. Minimize x²/2 subject to x=1 from0 in a radius2 region. The exact
 *    penalized minimizer is min(mu,1). Starting at mu=1/32, the best violation
 *    step is feasible, so steering must solve at1/32,5/16 and25/8 before
 *    accepting1. Repricing and ordinary convexification reach that same
 *    point and price, then settle on zero predicted decrease.
 * 2. In a radius1/4 region the equality is not yet attainable. Starting at
 *    mu=1/128, steering needs one growth to5/64 to retain at least one tenth
 *    of the best1/4 violation reduction. It accepts5/64 after one round,
 *    reports the still-infeasible59/64 violation and does not invent full
 *    feasibility or convergence.
 * 3. Owned callbacks distinguish required current solves from inactive work:
 *    repricing avoids repeated objective convexification at the same x;
 *    violation-only geometry is still built once when needed; each price
 *    solves anew; only the accepted shell receives taken and exposes trial.
 * 4. At radius1/4 and mu1/16, the initial objective step already meets the
 *    steering's required progress, so no repricing occurs. The last solved
 *    shell is violation-only, but trial/acceptance still belong to the
 *    original objective shell at1/16, never that best-violation point1/4.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the scalar equality, exact l1 model, rational expected prices/iterates, trust-region distinction, zero-growth model selection and callback ownership in four scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Runs public SCO.minimise on an owned exact convex problem with and without reprice. It checks hand-derived accepted points, penalty, remaining violation, termination, actual solve traces, required violation-only construction and the accepted shell's notification/lazy trial reads.
 * @evidence contracts/development/testing.md#independent-expectations On0<=x<=1 the merit derivative is x-mu, so its exact regional minimizer is clamp(mu,x-radius,x+radius) clipped at1. Equality feasibility forces25/8 in the wide-region price ladder. In the quarter region, the first1/128 reduction is below0.1/4 while5/64 exceeds it; its exact merit reduction is mu²/2. Binary rational inputs make those calculations exact apart from ordinary scalar operations; numerical comparisons retain1e-12.
 * @evidence contracts/development/testing.md#distinguishing-cases Compares optional repricing against the general fallback, feasible versus region-limited best steps, two/one/zero penalty growth, actual convergence versus spent rounds, required solves versus avoided geometry, and lazy trial/acceptance ownership even when the most recent solve is an unselected violation-only shell. QP matrix/result ownership and nonlinear correction have separate tests.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable unit owns the exact in-memory problem and all callback traces. It calls the actual public coordinator, imports no internal helper and replaces no library function, host or global.
 */
export function test_geometry_sequential_reprice_contracts(): void {
  for (const [radius, penalty, grows] of [[2, 1 / 32, 2], [0.25, 1 / 128, 1], [0.25, 1 / 16, 0]] as const) {
    const wide: boolean = radius === 2;
    const expected: number = wide ? 1 : grows === 0 ? 1 / 16 : 5 / 64;
    const price: number = wide ? 25 / 8 : expected;
    const traces: ITrace[] = [];
    for (const prepared of [false, true]) {
      const trace: ITrace = { built: [], solved: [], repriced: [], read: [], taken: [] };
      const problem: SCO.IProblem<number, SCO.IEvaluation> = {
        evaluate,
        feasible: (reading: SCO.IEvaluation): boolean => reading.violation === 0,
        convexify: (x: number, _current: SCO.IEvaluation, mu: number,
          _radius: number, objective: boolean): SCO.IModel<number> => {
          trace.built.push({ x, mu, objective });
          return model(x, mu, objective, prepared, trace);
        },
      };
      const result: SCO.IResult<number, SCO.IEvaluation> = SCO.minimise(problem, 0, {
        schedule: {
          eta: 0.1, low: 0.25, high: 0.75, shrink: 0.5, expand: 2,
          boundary: true, widest: radius, trust: radius,
          least: 1e-9, tries: 4, improved: (): number => 0,
        },
        penalties: [penalty], rounds: wide ? 3 : 1, steer: true,
      });
      TestValidator.predicate(`analytic steered point radius=${radius}, prepared=${prepared}`,
        nclose(result.x, expected, 1e-12) && nclose(result.penalty, price, 1e-12) &&
        nclose(result.evaluation.objective, expected ** 2 / 2, 1e-12) &&
        nclose(result.evaluation.violation, 1 - expected, 1e-12) &&
        !result.collapsed && result.settled === wide &&
        result.reason === (wide ? "model" : "rounds"),
      );

      const objectiveSolves: IPoint[] = trace.solved.filter((point: IPoint): boolean => point.objective);
      const expectedPrices: readonly number[] = wide ? [1 / 32, 5 / 16, 25 / 8, 25 / 8]
        : grows === 0 ? [1 / 16] : [1 / 128, 5 / 64];
      TestValidator.predicate("each current price performs its own actual subproblem solve",
        objectiveSolves.length === expectedPrices.length && objectiveSolves.every(
          (point: IPoint, i: number): boolean => nclose(point.mu, expectedPrices[i]!, 1e-12) &&
            nclose(point.x, wide && i === 3 ? 1 : 0, 1e-12)),
      );
      const violationBuilds: IPoint[] = trace.built.filter((point: IPoint): boolean => !point.objective);
      const violationSolves: IPoint[] = trace.solved.filter((point: IPoint): boolean => !point.objective);
      TestValidator.predicate("steering retains the required independent violation-only model",
        violationBuilds.length === 1 && violationSolves.length === 1 &&
        nclose(violationBuilds[0]!.x, 0, 1e-12) &&
        nclose(violationSolves[0]!.mu, penalty, 1e-12),
      );
      const objectiveBuilds: number = trace.built.length - violationBuilds.length;
      TestValidator.predicate("fixed geometry is shared only by declared same-iterate repricing",
        objectiveBuilds === (prepared ? (wide ? 2 : 1) : expectedPrices.length) &&
        trace.repriced.length === (prepared ? grows : 0),
      );
      TestValidator.predicate("discarded prices do not expose lazy trials or claim acceptance",
        trace.read.length === 1 && trace.taken.length === 1 &&
        nclose(trace.read[0]!.mu, price, 1e-12) && nclose(trace.taken[0]!.mu, price, 1e-12) &&
        trace.read[0]!.objective && trace.taken[0]!.objective,
      );
      if (grows === 0)
        TestValidator.predicate("zero growth selects objective metadata after the later best-violation solve",
          trace.solved.length === 2 && !trace.solved.at(-1)!.objective &&
          trace.read[0]!.objective && trace.taken[0]!.objective && nclose(result.x, 1 / 16, 1e-12),
        );
      traces.push(trace);
    }
    TestValidator.predicate("repricing and fallback retain the same solve dependencies",
      traces[0]!.solved.length === traces[1]!.solved.length && traces[0]!.solved.every(
        (point: IPoint, i: number): boolean => {
          const other: IPoint = traces[1]!.solved[i]!;
          return point.objective === other.objective && nclose(point.x, other.x, 1e-12) &&
            nclose(point.mu, other.mu, 1e-12);
        }),
    );
  }
}

/** Numeric provenance of one owned model shell, independent of its solution. */
interface IPoint { x: number; mu: number; objective: boolean }

/** Separate declared construction, solve, repricing, lazy output and acceptance work. */
interface ITrace {
  built: IPoint[];
  solved: IPoint[];
  repriced: IPoint[];
  read: IPoint[];
  taken: IPoint[];
}

/** Read the original objective and equality violation, without a model oracle. */
function evaluate(x: number): SCO.IEvaluation {
  return { objective: x * x / 2, violation: Math.abs(1 - x) };
}

/** Construct an exact rational scalar model; changing its price never retains a step. */
function model(x: number, mu: number, objective: boolean, prepared: boolean,
  trace: ITrace): SCO.IModel<number> {
  const point: IPoint = { x, mu, objective };
  return {
    solve: (radius: number): SCO.IStep<number> => {
      trace.solved.push(point);
      const wanted: number = objective ? Math.min(1, mu) : 1;
      const trial: number = Math.max(x - radius, Math.min(x + radius, wanted));
      const before: SCO.IEvaluation = evaluate(x);
      const after: SCO.IEvaluation = evaluate(trial);
      const predicted: number = (objective ? before.objective - after.objective : 0) +
        mu * (before.violation - after.violation);
      return {
        get trial(): number { trace.read.push(point); return trial; },
        predicted, length: Math.abs(trial - x), full: Math.abs(trial - x) === radius,
        violation: after.violation, met: after.violation === 0, accuracy: 0,
      };
    },
    taken: (): void => { trace.taken.push(point); },
    ...(prepared && objective ? {
      reprice: (penalty: number): SCO.IModel<number> => {
        trace.repriced.push({ x, mu: penalty, objective });
        return model(x, penalty, objective, prepared, trace);
      },
    } : {}),
  };
}
