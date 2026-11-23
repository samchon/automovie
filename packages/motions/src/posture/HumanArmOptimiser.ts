import type {
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMovieMotionHumanSequentialConvex,
} from "@automovie/interface";

import { HumanArmTrajectoryConvex } from "./HumanArmTrajectoryConvex";
import { HumanArmTrajectoryKnots as Knots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectorySmooth } from "./HumanArmTrajectorySmooth";
import type { HumanQuadraticInteriorSession } from "./HumanQuadraticInteriorSession";
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
   * @param fine The context at the frame grid's instants over the same span. When it holds more instants than `context`, the waypoints are knots: every evaluation and linearisation is the grid's, on the knots' interpolant, and the steps are the knots' (`HumanArmTrajectoryKnots`), the rounds reading the clearance pairs at the knots' instants alone and the motion terms and the sweeps on every instant; absent, or for a still configuration, the waypoints are read themselves.
   * @returns The last iterate at the waypoints, its evaluation (the grid's in full where a grid was read) and the penalty it was reached at.
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

    // The clearance pairs, the costliest of the model's readings, are read
    // at the knots' own instants by the rounds, the swept spheres between
    // every two frames keeping the continuous check and every motion term
    // read on every frame, so the path optimised is the one played; the
    // converged path is then read whole, which the caller admits by.
    const contact: boolean[] | undefined =
      grid === undefined
        ? undefined
        : ((): boolean[] => {
            const at: Set<number> = new Set(context.times);
            return grid.times.map((t: number): boolean => at.has(t));
          })();

    // The objective's exact quadratic terms, the same at every iterate.
    const smooth: HumanArmTrajectorySmooth.ISmooth =
      HumanArmTrajectorySmooth.of(read);

    // Every subproblem of this solve is one session of the interior-point
    // solve (`HumanQuadraticInteriorSession`): the first subproblem at a
    // penalty equilibrates the rest at that penalty, the scratch is kept,
    // and the models of one linearisation (a smaller region, a reprice),
    // which share its rows, each start from the one solved before; the
    // violation alone, another objective, starts cold. Every soft row weighs the penalty, so a subproblem at another
    // penalty has data of another magnitude: it is equilibrated again, and
    // starts cold, as OSQP and Ipopt scale again when their data's magnitude
    // changes (`scaledAt`).
    const session: HumanQuadraticInteriorSession.ISession = {};
    let scaledAt: number | undefined;
    // A still solve never steps its fixed endpoints. Its single initial
    // reading supplies those placements throughout this synchronous solve.
    const changing: boolean[] | undefined = read.still
      ? read.times.map((_time: number, i: number): boolean => M.inner(read, i))
      : undefined;
    let fixed: Parameters<typeof M.evaluate>[2];
    const problem: IAutoMovieMotionHumanSequentialConvex.IProblem<number[][][], M.IEvaluation> = {
      evaluate: (x: number[][][]): M.IEvaluation => {
        const evaluation: M.IEvaluation = M.evaluate(read, spread(x), fixed, contact);
        if (changing !== undefined && fixed === undefined)
          fixed = { reading: evaluation, laid: changing };
        return evaluation;
      },
      feasible: (evaluation: M.IEvaluation): boolean =>
        evaluation.worst.value <= M.TOLERANCE,
      convexify: (
        x: number[][][],
        evaluation: M.IEvaluation,
        mu: number,
        radius: number,
        objective: boolean,
      ): IAutoMovieMotionHumanSequentialConvex.IModel<number[][][]> => {
        // A new linearisation has other rows: no earlier point starts it.
        session.point = undefined;

        // The pairs that can enter the subproblem are read one growth of the
        // region beyond it.
        const built: IAutoMovieMotionHumanQuadraticProgram.IProblem = HumanArmTrajectoryConvex.convexify(
          read,
          spread(x),
          evaluation,
          mu,
          SCHEDULE.expand * radius,
          smooth,
        );
        const model: IAutoMovieMotionHumanSequentialConvex.IModel<number[][][]> = shell(
          grid === undefined ? built : Knots.reduce(context, weights!, built),
          x,
          mu,
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
    const shell = (model: IAutoMovieMotionHumanQuadraticProgram.IProblem, x: number[][][], mu: number, objectiveFree: boolean = false): IAutoMovieMotionHumanSequentialConvex.IModel<number[][][]> => {
      let zero: number | undefined;

      // The splitting's fixed model of this shell's rows, made only for a
      // region the interior method leaves unsolved.
      let fallback: ReturnType<typeof QP.prepare> | undefined;

      // The region's rows, one per variable, built once for the model: a
      // retry in a smaller region changes only their two ends.
      const trust: IAutoMovieMotionHumanQuadraticProgram.IRow[] = Array.from(
        { length: model.n },
        (_: unknown, i: number): IAutoMovieMotionHumanQuadraticProgram.IRow => ({
          index: [i],
          coef: [1],
          l: 0,
          u: 0,
          key: `t|${i}`,
        }),
      );
      const trusted: IAutoMovieMotionHumanQuadraticProgram.IProblem = {
        ...model,
        rows: [...model.rows, ...trust],
      };
      return {
        solve: (r: number): IAutoMovieMotionHumanSequentialConvex.IStep<number[][][]> => {
          for (const row of trust) {
            row.l = -r;
            row.u = r;
          }

          // The interior-point solve. Every row but the trust region's is
          // elastic (`HumanArmTrajectoryConvex`), so the subproblem has a
          // solution, the zero step among its feasible points; where the
          // interior method leaves it unsolved, the operator splitting
          // solves it (`HumanQuadraticProgram.prepare`), its iterate judged
          // by the merit like any other: a failed solve is never read as a
          // zero step, which the loop would answer by shrinking the region
          // round an iterate the model can still improve.
          if (scaledAt !== mu) {
            session.scaling = undefined;
            session.point = undefined;
            scaledAt = mu;
          }
          // The violation alone is another problem than the model whose
          // point the session holds: its objective, the soft rows' penalties
          // alone, is no small change of the model's, the premise of an
          // interior-point warm start (Yildirim and Wright 2002, "Warm-start
          // strategies in interior-point methods for linear programming",
          // SIAM J Optim 12:782), and a start from that point measured as
          // failing in four of five solves, each then solved again cold. It
          // starts cold.
          if (objectiveFree) session.point = undefined;
          const solved: Float64Array =
            QP.interior(trusted, session)?.x ??
            (fallback ??= QP.prepare(trusted)).solve(trusted.rows).x;
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
        reprice: (penalty: number): IAutoMovieMotionHumanSequentialConvex.IModel<number[][][]> =>
          shell(
            {
              ...model,
              rows: model.rows.map((row: IAutoMovieMotionHumanQuadraticProgram.IRow): IAutoMovieMotionHumanQuadraticProgram.IRow =>
                row.weight === undefined ? row : { ...row, weight: penalty }),
            },
            x,
            penalty,
          ),
        feasibility: (): IAutoMovieMotionHumanSequentialConvex.IModel<number[][][]> =>
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
            mu,
            true,
          ),
      };
    };
    const solved: IAutoMovieMotionHumanSequentialConvex.IResult<number[][][], M.IEvaluation> = SCO.minimise(
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

        // A reduction of the violation under the millimetre the plan accepts
        // as feasible is one the plan cannot tell (`IOptions.stationary`).
        stationary: M.TOLERANCE,
        ...(from === undefined ? {} : { from }),
      },
    );
    return {
      x: solved.x,
      evaluation:
        contact === undefined
          ? solved.evaluation
          : M.evaluate(read, spread(solved.x)),
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
 * ("minimum merit function improvement ratio of 10^-4"), read before a
 * step is tried as TrajOpt's sco reads it; the least step or region, the
 * last guard, TrajOpt's min_trust_box_size (1e-4, sco's default). This
 * planner's values, unsourced: the first region (8 coordinate units), the
 * widest (four times it) and six tries a convexification.
 */
const SCHEDULE: IAutoMovieMotionHumanSequentialConvex.ISchedule = {
  eta: 0.1,
  low: 0.1,
  high: 0.1,
  shrink: 0.25,
  expand: 1.5,
  boundary: false,
  widest: 8 * 4,
  trust: 8,
  least: 1e-4,
  tries: 6,
  improved: (merit: number): number => 1e-4 * Math.max(1, merit),
};
