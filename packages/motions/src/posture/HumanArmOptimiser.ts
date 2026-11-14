import { HumanArmTrajectoryConvex } from "./HumanArmTrajectoryConvex";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanQuadraticProgram as QP } from "./HumanQuadraticProgram";

/**
 * TrajOpt's penalty sequential convex optimisation with a trust region
 * (Schulman et al. 2014, "Motion planning with sequential convex optimization
 * and convex collision checking", IJRR 33:1251, Algorithm 1) of an arms'
 * waypoints under `HumanArmTrajectoryModel`'s objective and constraints:
 * each convex subproblem is solved (`HumanQuadraticProgram`), its step taken
 * where the merit falls by a tenth of what the model predicts and the trust
 * region shrunk where not, and the penalty raised tenfold while the
 * constraints are not met. A problem still infeasible at the last penalty
 * is left to the caller to refuse. A solve continued from another's result
 * on refined waypoints starts at that result's penalty, the continuation of
 * a penalty method, in place of the first.
 */
export namespace HumanArmOptimiser {
  /**
   * Optimise from an iterate.
   *
   * @param context The problem's context.
   * @param start Each arm's coordinates at each waypoint; the first and the last waypoint stay.
   * @param from The penalty to start at, a solve continued from an earlier one of the same problem on other waypoints (`penalty` of its result); the first when absent.
   * @returns The last iterate, its evaluation and the penalty it was reached at.
   */
  export function optimise(
    context: M.IContext,
    start: readonly (readonly (readonly number[])[])[],
    from?: number,
  ): { x: number[][][]; evaluation: M.IEvaluation; penalty: number } {
    const x: number[][][] = start.map((arm: readonly (readonly number[])[]): number[][] => arm.map((v: readonly number[]): number[] => [...v]));
    let current: M.IEvaluation = M.evaluate(context, x);
    // The last accepted subproblem's multipliers, which the next starts from.
    let duals: Map<string, number> | undefined;
    let radius: number = TRUST;
    let penalty: number = PENALTIES[0]!;
    for (const mu of PENALTIES) {
      // A continued solve keeps the penalty its iterate was reached at.
      if (from !== undefined && mu < from) continue;
      penalty = mu;
      for (let round: number = 0; round < ROUNDS; ++round) {
        const model: QP.IProblem = HumanArmTrajectoryConvex.convexify(context, x, current, mu, 1.5 * radius);
        const merit: number = current.objective + mu * current.violation;
        let warm: QP.IState | undefined;
        let accepted: boolean = false;
        let settled: boolean = false;
        for (let shrink: number = 0; shrink < SHRINKS; ++shrink) {
          const trusted: QP.IProblem = {
            ...model,
            rows: [
              ...model.rows,
              ...Array.from({ length: model.n }, (_, i: number): QP.IRow => ({
                index: [i],
                coef: [1],
                l: -radius,
                u: radius,
                key: `t|${i}`,
              })),
            ],
          };
          warm = QP.solve(trusted, warm, duals);
          const step: Float64Array = warm.x;
          const predicted: number = QP.value(model, new Float64Array(model.n)) - QP.value(model, step);
          const trial: number[][][] = M.stepped(context, x, step);
          const next: M.IEvaluation = M.evaluate(context, trial);
          const actual: number = merit - (next.objective + mu * next.violation);
          let largest: number = 0;
          for (let i: number = 0; i < step.length; ++i) largest = Math.max(largest, Math.abs(step[i]!));
          if (predicted > 0 && actual / predicted > 0.1) {
            for (let a: number = 0; a < x.length; ++a) x[a] = trial[a]!;
            duals = QP.multipliers(trusted, warm);
            current = next;
            radius = Math.min(TRUST * 4, radius * 1.5);
            accepted = true;
            // Converged: the merit no longer falls, or the step no longer moves.
            settled = predicted < 1e-6 * Math.max(1, merit) || largest < STILL;
            break;
          }
          radius *= 0.25;
          if (radius < STILL) {
            settled = true;
            break;
          }
        }
        if (!accepted || settled) break;
      }
      if (current.worst.value <= M.TOLERANCE) break;
      radius = TRUST;
    }
    return { x, evaluation: current, penalty };
  }
}

/** The penalties tried, each ten times the last. */
const PENALTIES: readonly number[] = [10, 100, 1000, 10000];

/** Convexifications per penalty at most. */
const ROUNDS: number = 20;

/** Trust-region shrinks per convexification at most. */
const SHRINKS: number = 6;

/** The trust region's initial half-width, coordinate units. */
const TRUST: number = 8;

/** A step or trust region below which the solve has settled, coordinate units. */
const STILL: number = 1e-3;
