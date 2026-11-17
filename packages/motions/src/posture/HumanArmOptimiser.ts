import { HumanArmTrajectoryConvex } from "./HumanArmTrajectoryConvex";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanQuadraticProgram as QP } from "./HumanQuadraticProgram";
import { HumanSequentialConvex as SCO } from "./HumanSequentialConvex";

/**
 * TrajOpt's penalty sequential convex optimisation with a trust region
 * (Schulman et al. 2014, "Motion planning with sequential convex optimization
 * and convex collision checking", IJRR 33:1251, Algorithm 1) of an arms'
 * waypoints under `HumanArmTrajectoryModel`'s objective and constraints, run
 * by the shared loop (`HumanSequentialConvex`): each convex subproblem
 * (`HumanArmTrajectoryConvex`) is solved within the region by
 * `HumanQuadraticProgram`, warm-started across the region's shrinking and
 * from the multipliers of the last step taken; a step is taken where the
 * merit falls by a tenth of what the model predicts and the region shrunk
 * where not. The penalty is steered (Byrd, Nocedal and Waltz 2008,
 * `HumanSequentialConvex.IOptions.steer`): each round it grows tenfold
 * until the step keeps its share of what the linearised constraints allow,
 * from the first of `PENALTIES`, so an iterate is not carried off the
 * constraints by the objective at a penalty too low and brought back at
 * the next (measured: a sit's reach feasible at round 2, infeasible again by
 * round 11, feasible at round 18 under the fixed ladder). A problem still infeasible at the last penalty is left to the caller
 * to refuse. A solve continued from another's result on refined waypoints
 * starts at that result's penalty, the continuation of a penalty method, in
 * place of the first.
 */
export namespace HumanArmOptimiser {
  /**
   * Optimise from an iterate.
   *
   * @param context The problem's context.
   * @param start Each arm's coordinates at each waypoint; the first and the last waypoint stay.
   * @param from The penalty to start at, a solve continued from an earlier one of the same problem on other waypoints (`penalty` of its result); the first when absent.
   * @returns The last iterate, its evaluation and the penalty it was reached at.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States unchanged waypoint endpoints, penalty continuation and actual final evaluation.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the existing TrajOpt merit/trust loop and actual nonlinear evaluation; each convexification fixes P/q/A and only its trust intervals vary across retries.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure TrajectoryConvex owns rows, QP.prepare owns admitted immutable numeric snapshots, and the shared sequential-convex loop owns acceptance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every model row, penalty, warm iterate, keyed multiplier, trust schedule and actual trial evaluation; no previous answer or relaxed feasibility supplies a result.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fixed model preparation per convexification replaces repeated coefficient/scaling-equivalence scans on bound-only retries; each retry retains full OSQP work and O(m) interval updates, without a measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work An operation-local prepared model snapshots actual P/q/A and ordered unit trust rows; new iterates/penalties create another model while changing radius supplies fresh intervals and original warm/dual data.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each convexification owns one fixed numeric snapshot and bounded solver scratch until replacement or return; returned coordinates/evaluation remain independent and no trajectory/fit result history is cached.
   */
  export function optimise(
    context: M.IContext,
    start: readonly (readonly (readonly number[])[])[],
    from?: number,
  ): { x: number[][][]; evaluation: M.IEvaluation; penalty: number } {
    // The multipliers of the last step taken, which the next subproblem
    // starts from.
    let duals: Map<string, number> | undefined;

    // The last linearisation built: the steering asks for the same iterate,
    // penalty and region twice, with and without the objective, and both are
    // the same rows.
    let kept:
      | { x: number[][][]; mu: number; radius: number; built: QP.IProblem }
      | undefined;
    const problem: SCO.IProblem<number[][][], M.IEvaluation> = {
      evaluate: (x: number[][][]): M.IEvaluation => M.evaluate(context, x),
      feasible: (evaluation: M.IEvaluation): boolean =>
        evaluation.worst.value <= M.TOLERANCE,
      convexify: (
        x: number[][][],
        evaluation: M.IEvaluation,
        mu: number,
        radius: number,
        objective: boolean,
      ): SCO.IModel<number[][][]> => {
        // The pairs that can enter the subproblem are read one growth of the
        // region beyond it.
        if (
          kept === undefined ||
          kept.x !== x ||
          kept.mu !== mu ||
          kept.radius !== radius
        )
          kept = {
            x,
            mu,
            radius,
            built: HumanArmTrajectoryConvex.convexify(
              context,
              x,
              evaluation,
              mu,
              SCHEDULE.expand * radius,
            ),
          };
        const built: QP.IProblem = kept.built;

        // The steering's step of the violation alone is the same rows with
        // no objective (Byrd, Nocedal and Waltz's (5.10)).
        return shell(
          objective
            ? built
            : {
                ...built,
                p: built.p.map((row: Float64Array): Float64Array => new Float64Array(row.length)),
                q: new Float64Array(built.q.length),
              },
          x,
        );
      },
    };

    // One linearisation at one penalty as the loop's model. Every soft row
    // weighs the penalty itself, so the same linearisation at another
    // penalty is the same rows reweighed (`reprice`), with no geometry read
    // again.
    const shell = (model: QP.IProblem, x: number[][][]): SCO.IModel<number[][][]> => {
      let zero: number | undefined;
      let prepared: ReturnType<typeof QP.prepare> | undefined;
      let warm: QP.IState | undefined;

      // The region's rows, one per variable, built once for the model: a
      // retry in a smaller region changes only their two ends.
      const trust: QP.IRow[] = Array.from(
        { length: model.n },
        (_: unknown, i: number): QP.IRow => ({
          index: [i],
          coef: [1],
          l: 0,
          u: 0,
          key: `t|${i}`,
        }),
      );
      const trusted: QP.IProblem = {
        ...model,
        rows: [...model.rows, ...trust],
      };
      return {
        solve: (r: number): SCO.IStep<number[][][]> => {
          for (const row of trust) {
            row.l = -r;
            row.u = r;
          }
          prepared ??= QP.prepare(trusted);
          warm = prepared.solve(trusted.rows, warm, duals);
          const solved: Float64Array = warm.x;
          let length: number = 0;
          for (let i: number = 0; i < warm.x.length; ++i)
            length = Math.max(length, Math.abs(warm.x[i]!));

          // What the step leaves of the linearised constraints: each soft
          // row's excess past its interval, millimetres, summed as the
          // model's evaluation sums the constraints' violations.
          let violation: number = 0;
          let most: number = 0;
          for (const row of model.rows) {
            if (row.weight === undefined) continue;
            let value: number = 0;
            for (let i: number = 0; i < row.index.length; ++i)
              value += row.coef[i]! * solved[row.index[i]!]!;
            const excess: number = Math.max(0, row.l - value, value - row.u);
            violation += excess;
            most = Math.max(most, excess);
          }
          let trial: number[][][] | undefined;
          return {
            get trial(): number[][][] {
              return (trial ??= M.stepped(context, x, solved));
            },
            predicted: (zero ??= QP.value(model)) - QP.value(model, warm.x),
            length,
            // The step at the region's edge, to the solver's own accuracy.
            full: length >= r * (1 - QP.TOLERANCE),
            violation,
            met: most <= M.TOLERANCE,
          };
        },
        taken: (): void => {
          duals = QP.multipliers(trusted, warm!);
        },
        reprice: (penalty: number): SCO.IModel<number[][][]> =>
          shell(
            {
              ...model,
              rows: model.rows.map((row: QP.IRow): QP.IRow =>
                row.weight === undefined ? row : { ...row, weight: penalty }),
            },
            x,
          ),
      };
    };
    const solved: SCO.IResult<number[][][], M.IEvaluation> = SCO.minimise(
      problem,
      start.map((arm: readonly (readonly number[])[]): number[][] =>
        arm.map((v: readonly number[]): number[] => [...v]),
      ),
      {
        schedule: SCHEDULE,
        penalties: PENALTIES,
        rounds: ROUNDS * PENALTIES.length,
        steer: true,
        ...(from === undefined ? {} : { from }),
      },
    );
    return {
      x: solved.x,
      evaluation: solved.evaluation,
      penalty: solved.penalty,
    };
  }
}

/** The penalty a solve starts at, the first, TrajOpt's own (sco's merit_error_coeff); the steering raises it from there. The ladder's length still sizes the rounds a solve may take (`ROUNDS` each), as the four penalties of the fixed ladder did. */
const PENALTIES: readonly number[] = [10, 100, 1000, 10000];

/** Convexifications per ladder penalty at most: this planner's value, unsourced (TrajOpt's max_iter is 50); a steered solve may take as many as the whole ladder could. */
const ROUNDS: number = 20;

/**
 * The region's schedule. Sourced: a step is taken where the merit falls by
 * more than a tenth of the model's prediction, an eta within Nocedal and
 * Wright's Algorithm 4.1 range [0, 1/4); a step not taken quarters the
 * region, Algorithm 4.1's factor; a step taken widens it by half, TrajOpt's
 * trust_expand_ratio, on every step taken as TrajOpt does. This planner's
 * values, unsourced: the first region (8 coordinate units, set again at
 * each penalty), the widest (four times it), six tries a convexification,
 * and the settling tests (a step or region of a thousandth of a unit, a
 * predicted decrease of a millionth of the merit).
 */
const SCHEDULE: SCO.ISchedule = {
  eta: 0.1,
  low: 0.1,
  high: 0.1,
  shrink: 0.25,
  expand: 1.5,
  boundary: false,
  widest: 8 * 4,
  trust: 8,
  least: 1e-3,
  tries: 6,
  improved: (merit: number): number => 1e-6 * Math.max(1, merit),
};
