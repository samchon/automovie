import { HumanArmTrajectoryConvex } from "./HumanArmTrajectoryConvex";
import { HumanArmTrajectoryKnots as Knots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectorySmooth } from "./HumanArmTrajectorySmooth";
import { HumanQuadraticProgram as QP } from "./HumanQuadraticProgram";
import { HumanSequentialConvex as SCO } from "./HumanSequentialConvex";

/**
 * TrajOpt's penalty sequential convex optimisation with a trust region
 * (Schulman et al. 2014, "Motion planning with sequential convex optimization
 * and convex collision checking", IJRR 33:1251, Algorithm 1) of an arms'
 * waypoints under `HumanArmTrajectoryModel`'s objective and constraints, run
 * by the shared loop (`HumanSequentialConvex`): each convex subproblem
 * (`HumanArmTrajectoryConvex`) is solved within the region by the
 * interior-point method of `HumanQuadraticProgram.interior`, whose
 * iteration count does not grow with the conditioning of a trajectory's
 * second-difference curvature as an operator splitting's does; every row but
 * the trust region's is elastic, so each subproblem has a solution; a step is taken where the merit falls by a tenth of
 * what the model predicts and the region shrunk where not. The penalty is
 * steered (Byrd, Nocedal and Waltz 2008,
 * `HumanSequentialConvex.IOptions.steer`): each round it grows tenfold
 * until the step keeps its share of what the linearised constraints allow,
 * from the first of `PENALTIES` to the last at most, so an iterate is not
 * carried off the constraints by the objective at a penalty too low and
 * brought back at the next (measured: a sit's reach feasible at round 2,
 * infeasible again by round 11, feasible at round 18 under a fixed ladder).
 * A problem still infeasible at the last penalty is left to the caller to
 * refuse. A solve continued from another's result on refined waypoints
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
   * @param fine The context at the frame grid's instants over the same span. When it holds more instants than `context`, the waypoints are knots: every evaluation and linearisation is the grid's, on the knots' interpolant, and the steps are the knots' (`HumanArmTrajectoryKnots`); absent, or for a still configuration, the waypoints are read themselves.
   * @returns The last iterate at the waypoints, its evaluation (the grid's where a grid was read) and the penalty it was reached at.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States unchanged waypoint endpoints, penalty continuation and actual final evaluation.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the TrajOpt merit/trust loop and actual nonlinear evaluation; each convexification fixes P/q/A and only its trust intervals vary across retries, and each subproblem, its domain rows elastic as TrajOpt's, is solved by the interior method alone.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure TrajectoryConvex owns rows, TrajectorySmooth the exact curvature, the quadratic program its interior solve, and the shared sequential-convex loop acceptance; one model shell holds a linearisation and gives its repriced and objective-free variants.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every model row, penalty, trust schedule and actual trial evaluation; no previous answer or relaxed feasibility supplies a result, and an interior solve that misses its accuracy proposes no step rather than an inaccurate one.
   * @evidence contracts/development/implementation.md#efficient-algorithms One linearisation per round serves the round's model, its repriced variants and the steering's objective-free model; the exact curvature is built once per solve; a subproblem costs a bounded number of banded factorisations. No measured speedup is claimed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The context's exact curvature and each model's trust rows are values built once by their owner and handed on; nothing of a subproblem's solve is kept past it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each convexification owns one numeric snapshot and bounded solver scratch until replacement or return; returned coordinates/evaluation remain independent and no trajectory/fit result history is cached.
   */
  export function optimise(
    context: M.IContext,
    start: readonly (readonly (readonly number[])[])[],
    from?: number,
    fine?: M.IContext,
  ): { x: number[][][]; evaluation: M.IEvaluation; penalty: number } {
    // With a frame grid finer than the waypoints, the waypoints are knots:
    // the model is read and linearised at every grid instant on their
    // interpolant, and each subproblem is carried onto the knots' steps
    // (`HumanArmTrajectoryKnots`).
    const grid: M.IContext | undefined =
      fine !== undefined && !context.still && fine.n > context.n ? fine : undefined;
    const read: M.IContext = grid ?? context;
    const weights: number[][] | undefined =
      grid === undefined ? undefined : Knots.weights(context.times, grid.times);
    const spread = (x: number[][][]): number[][][] =>
      grid === undefined ? x : Knots.read(context.times, grid.times, x);

    // The objective's exact quadratic terms, the same at every iterate.
    const smooth: HumanArmTrajectorySmooth.ISmooth =
      HumanArmTrajectorySmooth.of(read);
    const problem: SCO.IProblem<number[][][], M.IEvaluation> = {
      evaluate: (x: number[][][]): M.IEvaluation => M.evaluate(read, spread(x)),
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
        const built: QP.IProblem = HumanArmTrajectoryConvex.convexify(
          read,
          spread(x),
          evaluation,
          mu,
          SCHEDULE.expand * radius,
          smooth,
        );
        const model: SCO.IModel<number[][][]> = shell(
          grid === undefined ? built : Knots.reduce(context, weights!, built),
          x,
        );
        return objective ? model : model.feasibility!();
      },
    };

    // One linearisation at one penalty as the loop's model. Every soft row
    // weighs the penalty itself, so the same linearisation at another
    // penalty is the same rows reweighed (`reprice`), and the steering's
    // step of the violation alone the same rows with no objective (Byrd,
    // Nocedal and Waltz's (5.10), `feasibility`), with no geometry read
    // again.
    const shell = (model: QP.IProblem, x: number[][][]): SCO.IModel<number[][][]> => {
      let zero: number | undefined;

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

          // The interior-point solve. Every row but the trust region's is
          // elastic (`HumanArmTrajectoryConvex`), so the subproblem has a
          // solution, the zero step among its feasible points; a solve that
          // ends short of its accuracy proposes no step, which the loop
          // reads as no decrease and answers by shrinking the region.
          const solved: Float64Array =
            QP.interior(trusted)?.x ?? new Float64Array(trusted.n);
          let length: number = 0;
          for (let i: number = 0; i < solved.length; ++i)
            length = Math.max(length, Math.abs(solved[i]!));

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
            predicted: (zero ??= QP.value(model)) - QP.value(model, solved),
            length,

            // The step at the region's edge, to the solver's own accuracy.
            full: length >= r * (1 - QP.TOLERANCE),
            violation,
            met: most <= M.TOLERANCE,
          };
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
        feasibility: (): SCO.IModel<number[][][]> =>
          shell(
            {
              ...model,
              p: model.p.map(
                (row: Float64Array): Float64Array =>
                  new Float64Array(row.length),
              ),
              q: new Float64Array(model.q.length),
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
        rounds: ROUNDS,
        steer: true,
        ceiling: PENALTIES[PENALTIES.length - 1]!,
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

/** The penalty a solve starts at, the first, TrajOpt's own (sco's merit_error_coeff), and the greatest the steering may raise it to, the last: the top of the ladder this planner climbed before it steered (this planner's value, unsourced). A problem still infeasible there is the caller's to refuse, not the penalty's to force. */
const PENALTIES: readonly number[] = [10, 100, 1000, 10000];

/** Convexifications a solve may take: the benchmark setting of Schulman et al. 2013, section VI ("maximum of 40 iterations"). */
const ROUNDS: number = 40;

/**
 * The region's schedule. Sourced: a step is taken where the merit falls by
 * more than a tenth of the model's prediction, an eta within Nocedal and
 * Wright's Algorithm 4.1 range [0, 1/4); a step not taken quarters the
 * region, Algorithm 4.1's factor; a step taken widens it by half, TrajOpt's
 * trust_expand_ratio, on every step taken as TrajOpt does; the solve has
 * settled where the model predicts a decrease below a ten-thousandth of
 * the merit, the benchmark setting of Schulman et al. 2013, section VI
 * ("minimum merit function improvement ratio of 10^-4"). This planner's
 * values, unsourced: the first region (8 coordinate units), the widest
 * (four times it), six tries a convexification, and the least step or
 * region, a thousandth of a unit.
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
  improved: (merit: number): number => 1e-4 * Math.max(1, merit),
};
