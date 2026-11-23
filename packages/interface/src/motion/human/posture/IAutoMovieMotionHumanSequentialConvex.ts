/**
 * Penalty sequential convex optimisation with a trust region, the outer loop of
 * TrajOpt (Schulman et al. 2014, "Motion planning with sequential convex
 * optimization and convex collision checking", IJRR 33:1251, Algorithm 1) over
 * any iterate: the caller convexifies its problem about an iterate at a penalty
 * and solves the convex model within a region; this loop takes or rejects the
 * step by the ratio of the merit's actual to its predicted decrease, moves the
 * region by the caller's schedule (`ISchedule`), and raises the penalty along
 * the caller's ladder while the constraints are not met, or steers it at every
 * iterate (`IOptions.steer`). The merit is the objective plus the penalty times
 * the constraints' summed violation, the l1 exact penalty (Nocedal and Wright
 * 2006, "Numerical Optimization", 2nd ed., section 17.2). A problem still
 * infeasible at the last penalty is left to the caller to refuse by its own
 * reading.
 */
export namespace IAutoMovieMotionHumanSequentialConvex {
  /** An iterate's reading: the merit's two parts. */
  export interface IEvaluation {
    /** The objective. */
    objective: number;

    /** The constraints' violations summed, in the units the penalty weighs. */
    violation: number;
  }

  /** The convex model's step within a region. */
  export interface IStep<X> {
    /**
     * The iterate reached, projected onto the caller's hard set; may be lazy
     * and select its proposal-local correction metadata. Steering reads only
     * diagnostics; the outer loop reads the chosen trial before its evaluation
     * and correction.
     */
    trial: X;

    /**
     * The model's decrease of the merit from the iterate to the step, `m(0) -
     * m(p)`.
     */
    predicted: number;

    /** The step's largest coordinate, in the region's units. */
    length: number;

    /**
     * Whether the step reaches the region's boundary, where a schedule that
     * grows only there (`ISchedule.boundary`) grows.
     */
    full: boolean;

    /**
     * The violation of the linearised constraints at the step, in the units the
     * penalty weighs, the model's own; the steering reads it
     * (`IOptions.steer`).
     */
    violation?: number;

    /**
     * Whether the step meets the linearised constraints to the caller's
     * tolerance, the steering's linear feasibility (`IOptions.steer`).
     */
    met?: boolean;

    /**
     * The model's own accuracy in the merit's units, below which a predicted
     * decrease is not one and the solve settles without trying the step (the
     * termination of an SQP on its subproblem's accuracy, Nocedal and Wright
     * chapter 18); never settles so when absent.
     */
    accuracy?: number;

    /**
     * Whether the subproblem's solver could not solve the model, after its own
     * recovery: no step is proposed, and the solve stops failed (`Reason`), as
     * TrajOpt's does where its convex solver fails (sco's OPT_FAILED); a step
     * otherwise.
     */
    failed?: boolean;
  }

  /** A convex model of the merit about an iterate, at one penalty. */
  export interface IModel<X> {
    /**
     * The model's step within a region.
     *
     * @param radius The region's half-width, in the caller's units.
     * @returns The step.
     */
    solve(radius: number): IAutoMovieMotionHumanSequentialConvex.IStep<X>;

    /**
     * Told that the last step solved was taken, so the caller's next model can
     * start from its solution (its multipliers, for one).
     */
    taken?(): void;

    /**
     * Reprice this same fixed linearization for steering, without rebuilding
     * its geometry or matrices. Absent, convexify rebuilds the model.
     *
     * @param penalty The new exact l1 penalty, at the same iterate/objective
     *   and row domain.
     * @returns A fresh model shell with the original cold/keyed-dual
     *   initialization; fixed numeric preparation may be shared sequentially.
     */
    reprice?(penalty: number): IAutoMovieMotionHumanSequentialConvex.IModel<X>;

    /**
     * This same linearisation at this same penalty without the objective, the
     * model of the steering's step of the violation alone (their (5.10)), for a
     * producer whose rows do not depend on the objective. Absent, the steering
     * asks `IProblem.convexify` for it.
     *
     * @returns The model of the violation alone, with its own cold start.
     */
    feasibility?(): IAutoMovieMotionHumanSequentialConvex.IModel<X>;
  }

  /** The problem, as the caller reads it. */
  export interface IProblem<
    X,
    E extends IAutoMovieMotionHumanSequentialConvex.IEvaluation,
  > {
    /**
     * An iterate's reading.
     *
     * @param x The iterate.
     * @returns Its objective and violation, and whatever else the caller reads.
     */
    evaluate(x: X): E;

    /**
     * The convex model about an iterate: the caller's own subproblem, solved by
     * whatever inner solve it chooses.
     *
     * @param x The iterate.
     * @param evaluation Its reading.
     * @param penalty The penalty's weight.
     * @param radius The region the model is next solved within, the widest of
     *   the round.
     * @param objective Whether the model holds the objective; false for the
     *   steering's step of the violation alone (`IOptions.steer`).
     * @returns The model.
     */
    convexify(
      x: X,
      evaluation: E,
      penalty: number,
      radius: number,
      objective: boolean,
    ): IAutoMovieMotionHumanSequentialConvex.IModel<X>;

    /**
     * Whether a reading meets the constraints, to the caller's tolerance.
     *
     * @param evaluation The reading.
     * @returns Whether it is feasible.
     */
    feasible(evaluation: E): boolean;

    /**
     * The second-order correction of a rejected step, against the Maratos
     * effect (Nocedal and Wright 2006, section 15.6, pp. 443-444): the step `p`
     * plus a correction `p^` that meets the constraints' linearisation at the
     * trial, `A(x) p^ + c(x + p) = 0` on the rows the step meets, its
     * minimum-norm solution being their (15.36). Asked only for a step whose
     * ratio did not exceed `ISchedule.eta` and whose predicted decrease is
     * positive, once per step and before the region shrinks; the corrected
     * point is judged on the step's own predicted decrease, taken where its
     * ratio exceeds `eta` and dropped otherwise, never searched along (their
     * Algorithm 15.2, p. 443, in the trust region of their Algorithm 18.4, p.
     * 549). Absent, no correction is tried.
     *
     * @param x The iterate.
     * @param step The rejected step.
     * @param trial The reading at the step's trial.
     * @returns The corrected point `x + p + p^`, or null where the caller has
     *   none.
     */
    correct?(
      x: X,
      step: IAutoMovieMotionHumanSequentialConvex.IStep<X>,
      trial: E,
    ): X | null;
  }

  /**
   * Why a solve stopped, read off its last convexification: `model`, the
   * model's predicted decrease under `ISchedule.improved` or within its own
   * accuracy (`IStep.accuracy`); `step`, a step taken under `ISchedule.least`,
   * or a rejected proposal under it at an already feasible iterate (numerical
   * no progress, not a stationarity certificate); `collapsed`, no step taken,
   * the region fallen under `ISchedule.least` or the tries spent; `rounds`, the
   * convexifications ran out (`IOptions.rounds`) with steps still being taken;
   * `infeasible`, a steered iterate at which the step of the violation alone,
   * inside its region, reduces the violation by no more than
   * `IOptions.stationary` while it still violates by more: a stationary point
   * of the violation.
   */
  export type Reason =
    | "model"
    | "step"
    | "collapsed"
    | "rounds"
    | "infeasible"
    | "failed";

  /**
   * How the region moves: a step is taken where the ratio of the actual to the
   * predicted decrease exceeds `eta`, and the region shrinks by `shrink` on
   * every step not taken, at most `tries` times a convexification; a step taken
   * shrinks the region where its ratio is below `low` and grows it by `expand`,
   * to `widest`, where its ratio exceeds `high` (on a step at the boundary when
   * `boundary` holds), Nocedal and Wright's Algorithm 4.1 in its general form.
   */
  export interface ISchedule {
    /** The ratio a step must exceed to be taken. */
    eta: number;

    /** The ratio below which a step taken shrinks the region. */
    low: number;

    /** The ratio above which a step taken grows the region. */
    high: number;

    /** The region's factor where it shrinks. */
    shrink: number;

    /** The region's factor where it grows. */
    expand: number;

    /** Whether the region grows only on a step that reaches its boundary. */
    boundary: boolean;

    /** The widest the region grows. */
    widest: number;

    /** The region's first half-width, set again at each penalty. */
    trust: number;

    /** A region or a step below which the solve has settled. */
    least: number;

    /**
     * Steps tried per convexification at most, the region shrinking between
     * them.
     */
    tries: number;

    /**
     * The predicted decrease below which the solve has settled.
     *
     * @param merit The merit at the iterate.
     * @returns The decrease.
     */
    improved: (merit: number) => number;
  }

  /** Minimise from an iterate. What a solve is run with. */
  export interface IOptions {
    /** The region's schedule. */
    schedule: IAutoMovieMotionHumanSequentialConvex.ISchedule;

    /**
     * The penalties, ascending, each tried while the constraints are not met at
     * the one before.
     */
    penalties: readonly number[];

    /**
     * Convexifications at most: per penalty of an unsteered ladder, and for the
     * whole of a steered solve, whose raised penalties share one budget.
     */
    rounds: number;

    /**
     * The penalty to start at, a solve continued from another's result
     * (`IResult.penalty`); the first when absent.
     */
    from?: number;

    /**
     * The region's first half-width, a solve following another of the same kind
     * (`IResult.radius`); `ISchedule.trust` when absent.
     */
    radius?: number;

    /**
     * Whether the penalty is steered (Byrd, Nocedal and Waltz 2008, "Steering
     * exact penalty methods for nonlinear programming", Optim Methods Softw
     * 23:197; Algorithm 5.1, p. 11 of the 2007 technical report): each round,
     * where the step at the penalty leaves the linearised constraints violated
     * (`IStep.met`), the step of the violation alone (the model without the
     * objective, their (5.10)) sets the progress a step can make; the penalty
     * grows by `STEERING.increase` until the step meets the linearised
     * constraints where that one does, or else reduces their violation by at
     * least `STEERING.feasibility` of what that one does (their (5.13), p. 10),
     * and then until the model's decrease is at least `STEERING.merit` times
     * the penalty times the step's reduction of the violation (their (5.14), p.
     * 10). The penalty is then tied to the problem at every iterate, so a start
     * the constraints' linearisation cannot satisfy is not pulled off them by
     * the objective, and the steps keep their progress on feasibility. With it,
     * `penalties` gives only the first penalty and `from` a continued one.
     * False when absent.
     */
    steer?: boolean;

    /**
     * The greatest penalty the steering may reach: a growth that would pass it
     * is not made, and the round goes on with the step at the penalty reached,
     * as it does when `STEERING.increases` are spent. Unbounded when absent;
     * read only with `steer`.
     */
    ceiling?: number;

    /**
     * The least reduction of the violation the caller can tell, in the
     * violation's units: its own feasibility tolerance. Where the steering's
     * step of the violation alone lies inside its region (not at its edge), it
     * is the linearised violation's own least; reducing the violation by no
     * more than this while the iterate violates by more, it shows the iterate a
     * first-order stationary point of the violation, an infeasible one that no
     * later round leaves, and the solve stops there with reason `infeasible`.
     * Absent, a solve runs its rounds; read only with `steer`.
     */
    stationary?: number;
  }

  /** Minimise from an iterate. A solve's result. */
  export interface IResult<X, E> {
    /** The last iterate taken. */
    x: X;

    /** Its reading. */
    evaluation: E;

    /** The penalty it was reached at. */
    penalty: number;

    /**
     * The region it ended with, which a following solve of the same kind may
     * start from (`IOptions.radius`).
     */
    radius: number;

    /**
     * Whether the last convexification ended with no step taken, its region
     * fallen below `ISchedule.least` or its tries spent, rather than on the
     * model's own accuracy.
     */
    collapsed: boolean;

    /** Why the solve stopped (`Reason`). */
    reason: IAutoMovieMotionHumanSequentialConvex.Reason;

    /**
     * Whether a convergence test with the region open ended the solve, its
     * reason `model` or `step`; a collapsed region and spent rounds are not, so
     * a caller can tell a solve that converged from one a cap or a collapse
     * stopped.
     */
    settled: boolean;
  }
}
