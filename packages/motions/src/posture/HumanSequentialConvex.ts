/**
 * Penalty sequential convex optimisation with a trust region, the outer loop
 * of TrajOpt (Schulman et al. 2014, "Motion planning with sequential convex
 * optimization and convex collision checking", IJRR 33:1251, Algorithm 1)
 * over any iterate: the caller convexifies its problem about an iterate at a
 * penalty and solves the convex model within a region; this loop takes or
 * rejects the step by the ratio of the merit's actual to its predicted
 * decrease, moves the region by the caller's schedule (`ISchedule`), and
 * raises the penalty along the caller's ladder while the constraints are not
 * met, or steers it at every iterate (`IOptions.steer`). The merit is the objective plus the penalty times the constraints'
 * summed violation, the l1 exact penalty (Nocedal and Wright 2006,
 * "Numerical Optimization", 2nd ed., section 17.2). A problem still
 * infeasible at the last penalty is left to the caller to refuse by its own
 * reading.
 */
export namespace HumanSequentialConvex {
  /** An iterate's reading: the merit's two parts. */
  export interface IEvaluation {
    /** The objective. */
    objective: number;

    /** The constraints' violations summed, in the units the penalty weighs. */
    violation: number;
  }

  /** The convex model's step within a region. */
  export interface IStep<X> {
    /** The iterate the step reaches, projected onto any hard set the caller keeps. */
    trial: X;

    /** The model's decrease of the merit from the iterate to the step, `m(0) - m(p)`. */
    predicted: number;

    /** The step's largest coordinate, in the region's units. */
    length: number;

    /** Whether the step reaches the region's boundary, where a schedule that grows only there (`ISchedule.boundary`) grows. */
    full: boolean;

    /** The violation of the linearised constraints at the step, in the units the penalty weighs, the model's own; the steering reads it (`IOptions.steer`). */
    violation?: number;

    /** Whether the step meets the linearised constraints to the caller's tolerance, the steering's linear feasibility (`IOptions.steer`). */
    met?: boolean;

    /** The model's own accuracy in the merit's units, below which a predicted decrease is not one and the solve settles without trying the step (the termination of an SQP on its subproblem's accuracy, Nocedal and Wright chapter 18); never settles so when absent. */
    accuracy?: number;
  }

  /** A convex model of the merit about an iterate, at one penalty. */
  export interface IModel<X> {
    /**
     * The model's step within a region.
     *
     * @param radius The region's half-width, in the caller's units.
     * @returns The step.
     */
    solve(radius: number): IStep<X>;

    /** Told that the last step solved was taken, so the caller's next model can start from its solution (its multipliers, for one). */
    taken?(): void;
  }

  /** The problem, as the caller reads it. */
  export interface IProblem<X, E extends IEvaluation> {
    /**
     * An iterate's reading.
     *
     * @param x The iterate.
     * @returns Its objective and violation, and whatever else the caller reads.
     */
    evaluate(x: X): E;

    /**
     * The convex model about an iterate: the caller's own subproblem, solved
     * by whatever inner solve it chooses.
     *
     * @param x The iterate.
     * @param evaluation Its reading.
     * @param penalty The penalty's weight.
     * @param radius The region the model is next solved within, the widest of the round.
     * @param objective Whether the model holds the objective; false for the steering's step of the violation alone (`IOptions.steer`).
     * @returns The model.
     */
    convexify(
      x: X,
      evaluation: E,
      penalty: number,
      radius: number,
      objective: boolean,
    ): IModel<X>;

    /**
     * Whether a reading meets the constraints, to the caller's tolerance.
     *
     * @param evaluation The reading.
     * @returns Whether it is feasible.
     */
    feasible(evaluation: E): boolean;

    /**
     * The second-order correction of a rejected step, against the Maratos
     * effect (Nocedal and Wright 2006, section 15.6, pp. 443-444): the step
     * `p` plus a correction `p^` that meets the constraints' linearisation at
     * the trial, `A(x) p^ + c(x + p) = 0` on the rows the step meets, its
     * minimum-norm solution being their (15.36). Asked only for a step whose
     * ratio did not exceed `ISchedule.eta` and whose predicted decrease is
     * positive, once per step and before the region shrinks; the corrected
     * point is judged on the step's own predicted decrease, taken where its
     * ratio exceeds `eta` and dropped otherwise, never searched along
     * (their Algorithm 15.2, p. 443, in the trust region of their Algorithm
     * 18.4, p. 549). Absent, no correction is tried.
     *
     * @param x The iterate.
     * @param step The rejected step.
     * @param trial The reading at the step's trial.
     * @returns The corrected point `x + p + p^`, or null where the caller has none.
     */
    correct?(x: X, step: IStep<X>, trial: E): X | null;
  }

  /**
   * Why a solve stopped, read off its last convexification: `model`, the
   * model's predicted decrease under `ISchedule.improved` or within its own
   * accuracy (`IStep.accuracy`); `step`, a step taken under
   * `ISchedule.least`, or a rejected proposal under it at an already feasible
   * iterate (numerical no progress, not a stationarity certificate);
   * `collapsed`, no step taken, the region fallen under
   * `ISchedule.least` or the tries spent; `rounds`, the convexifications ran
   * out (`IOptions.rounds`) with steps still being taken.
   */
  export type Reason = "model" | "step" | "collapsed" | "rounds";

  /**
   * How the region moves: a step is taken where the ratio of the actual to
   * the predicted decrease exceeds `eta`, and the region shrinks by `shrink`
   * on every step not taken, at most `tries` times a convexification; a
   * step taken shrinks the region where its ratio is below `low` and grows
   * it by `expand`, to `widest`, where its ratio exceeds `high` (on a step at
   * the boundary when `boundary` holds), Nocedal and Wright's Algorithm 4.1
   * in its general form.
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

    /** Steps tried per convexification at most, the region shrinking between them. */
    tries: number;

    /**
     * The predicted decrease below which the solve has settled.
     *
     * @param merit The merit at the iterate.
     * @returns The decrease.
     */
    improved: (merit: number) => number;
  }

  /** What a solve is run with. */
  export interface IOptions {
    /** The region's schedule. */
    schedule: ISchedule;

    /** The penalties, ascending, each tried while the constraints are not met at the one before. */
    penalties: readonly number[];

    /** Convexifications per penalty at most. */
    rounds: number;

    /** The penalty to start at, a solve continued from another's result (`IResult.penalty`); the first when absent. */
    from?: number;

    /** The region's first half-width, a solve following another of the same kind (`IResult.radius`); `ISchedule.trust` when absent. */
    radius?: number;

    /**
     * Whether the penalty is steered (Byrd, Nocedal and Waltz 2008, "Steering
     * exact penalty methods for nonlinear programming", Optim Methods Softw
     * 23:197; Algorithm 5.1, p. 11 of the 2007 technical report): each round,
     * where the step at the penalty leaves the linearised constraints
     * violated (`IStep.met`), the step of the violation alone (the model
     * without the objective, their (5.10)) sets the progress a step can make;
     * the penalty grows by `STEERING.increase` until the step meets the
     * linearised constraints where that one does, or else reduces their
     * violation by at least `STEERING.feasibility` of what that one does
     * (their (5.13), p. 10), and then until the model's decrease is at least
     * `STEERING.merit` times the penalty times the step's reduction of the
     * violation (their (5.14), p. 10). The penalty is then tied to the
     * problem at every iterate, so a start the constraints' linearisation
     * cannot satisfy is not pulled off them by the objective, and the steps
     * keep their progress on feasibility. With it, `penalties` gives only the
     * first penalty and `from` a continued one. False when absent.
     */
    steer?: boolean;
  }
  /** A solve's result. */
  export interface IResult<X, E> {
    /** The last iterate taken. */
    x: X;

    /** Its reading. */
    evaluation: E;

    /** The penalty it was reached at. */
    penalty: number;

    /** The region it ended with, which a following solve of the same kind may start from (`IOptions.radius`). */
    radius: number;

    /** Whether the last convexification ended with no step taken, its region fallen below `ISchedule.least` or its tries spent, rather than on the model's own accuracy. */
    collapsed: boolean;

    /** Why the solve stopped (`Reason`). */
    reason: Reason;

    /**
     * Whether a convergence test with the region open ended the solve, its
     * reason `model` or `step`; a collapsed region and spent rounds are
     * not, so a caller can tell a solve that converged from one a cap or a
     * collapse stopped.
     */
    settled: boolean;
  }

  /**
   * The steering's constants (`IOptions.steer`), as KNITRO-Active applies
   * Algorithm 5.1 (Byrd, Nocedal and Waltz, p. 13 of the 2007 technical
   * report): a step keeps `feasibility` = 0.1 of the best linearised
   * reduction of the violation (their epsilon_1 in (5.13)), the model's
   * decrease is `merit` = 0.5 of the penalty times the step's reduction (their
   * epsilon_2 in (5.14)), and the penalty grows tenfold until both hold;
   * `increases` bounds the growth where the objective falls under the
   * merit's rounding, sixteen tenfold increases, the decimal digits of a
   * double.
   */
  export const STEERING: Readonly<{
    feasibility: number;
    merit: number;
    increase: number;
    increases: number;
  }> = {
    feasibility: 0.1,
    merit: 0.5,
    increase: 10,
    increases: Math.ceil(-Math.log10(Number.EPSILON)),
  };

  /**
   * Minimise from an iterate.
   *
   * @param problem The problem.
   * @param start The first iterate.
   * @param options The schedule, the penalties, the rounds, a continued solve's penalty and region, and whether the penalty is steered.
   * @returns The last iterate taken, its reading, its penalty and region, whether the last convexification collapsed, why the solve stopped and whether it converged; the caller refuses an infeasible one by its own reading.
   */
  export function minimise<X, E extends IEvaluation>(
    problem: IProblem<X, E>,
    start: X,
    options: IOptions,
  ): IResult<X, E> {
    const s: ISchedule = options.schedule;
    const steer: boolean = options.steer === true;
    let x: X = start;
    let current: E = problem.evaluate(x);
    let radius: number = options.radius ?? s.trust;
    let penalty: number = options.penalties[0]!;
    let collapsed: boolean = false;
    let reason: Reason = "rounds";
    // A steered solve starts at the continued penalty when there is one, the first otherwise.
    const first: number =
      options.from !== undefined ? options.from : options.penalties[0]!;
    for (const ladder of steer ? [first] : options.penalties) {
      // A continued solve keeps the penalty its iterate was reached at.
      if (!steer && options.from !== undefined && ladder < options.from)
        continue;
      let mu: number = ladder;
      penalty = mu;
      for (let round: number = 0; round < options.rounds; ++round) {
        let model: IModel<X> = problem.convexify(x, current, mu, radius, true);
        let pending: IStep<X> | undefined;
        if (steer) {
          const steered: { mu: number; model: IModel<X>; step: IStep<X> } =
            steering(problem, x, current, mu, radius, model);
          mu = steered.mu;
          model = steered.model;
          pending = steered.step;
        }
        penalty = mu;
        const merit: number = current.objective + mu * current.violation;
        let taken: boolean = false;
        let settled: boolean = false;
        let told: boolean = false;
        let ended: Reason = "rounds";

        // The region shrinks until a step is taken, it is too small to move
        // the iterate, or its tries run out.
        for (let attempt: number = 0; attempt < s.tries; ++attempt) {
          const step: IStep<X> = pending ?? model.solve(radius);
          pending = undefined;

          // A predicted decrease within the model's own accuracy is no
          // decrease the model can tell.
          if (step.accuracy !== undefined && step.predicted <= step.accuracy) {
            told = true;
            settled = true;
            ended = "model";
            break;
          }
          const gain: (reading: E) => number = (reading: E): number =>
            step.predicted > 0
              ? (merit - (reading.objective + mu * reading.violation)) /
                step.predicted
              : -Infinity;
          let trial: X = step.trial;
          let next: E = problem.evaluate(trial);
          let ratio: number = gain(next);

          // A rejected step is corrected once, judged on its own predicted
          // decrease, before the region shrinks (`IProblem.correct`).
          if (
            !(ratio > s.eta) &&
            step.predicted > 0 &&
            problem.correct !== undefined
          ) {
            const corrected: X | null = problem.correct(x, step, next);
            if (corrected !== null) {
              const fixed: E = problem.evaluate(corrected);
              const again: number = gain(fixed);
              if (again > s.eta) {
                trial = corrected;
                next = fixed;
                ratio = again;
              }
            }
          }
          if (ratio > s.eta) {
            model.taken?.();
            x = trial;
            current = next;
            taken = true;
            if (ratio < s.low) radius *= s.shrink;
            else if (ratio > s.high && (step.full || !s.boundary))
              radius = Math.min(s.widest, radius * s.expand);

            // Settled: the model no longer improves the merit, or the step
            // no longer moves the iterate.
            const flat: boolean = step.predicted < s.improved(merit);
            settled = flat || step.length < s.least;
            if (settled) ended = flat ? "model" : "step";
            break;
          }
          // A rejected proposal that cannot move the current feasible
          // iterate by the caller's resolution is numerical no progress.
          // It is not an objective-error or stationarity certificate; an
          // infeasible iterate must still be reported as a collapse.
          if (step.length < s.least && problem.feasible(current)) {
            told = true;
            settled = true;
            ended = "step";
            break;
          }
          radius *= s.shrink;
          if (radius < s.least) {
            settled = true;
            break;
          }
        }
        collapsed = !taken && !told;
        reason = collapsed ? "collapsed" : ended;
        if (!taken || settled) break;
      }
      if (problem.feasible(current)) break;
      radius = s.trust;
    }
    return {
      x,
      evaluation: current,
      penalty,
      radius,
      collapsed,
      reason,
      settled: reason === "model" || reason === "step",
    };
  }

  /** Algorithm 5.1 of Byrd, Nocedal and Waltz at one region (`IOptions.steer`): the penalty, its model and the model's step. */
  function steering<X, E extends IEvaluation>(
    problem: IProblem<X, E>,
    x: X,
    current: E,
    penalty: number,
    radius: number,
    first: IModel<X>,
  ): { mu: number; model: IModel<X>; step: IStep<X> } {
    let mu: number = penalty;
    let model: IModel<X> = first;
    let step: IStep<X> = model.solve(radius);
    const reduced: (d: IStep<X>) => number = (d: IStep<X>): number => {
      if (d.violation === undefined)
        throw new Error(
          "A steered penalty needs each step's linearised violation",
        );
      return current.violation - d.violation;
    };
    const grow: () => void = (): void => {
      mu *= STEERING.increase;
      model = problem.convexify(x, current, mu, radius, true);
      step = model.solve(radius);
    };
    if (step.met !== true) {
      // The best the linearised constraints allow within the region: the
      // step of the violation alone. Where it meets them, so must the step
      // (Algorithm 5.1's step 2, p. 11); elsewhere the step keeps a share of
      // its reduction (step 3, (5.13), p. 10). Linear feasibility is the caller's, to its
      // tolerance, since a subproblem solved to a relative accuracy meets its
      // rows only to that accuracy.
      const best: IStep<X> = problem
        .convexify(x, current, mu, radius, false)
        .solve(radius);
      const enough: (d: IStep<X>) => boolean = (d: IStep<X>): boolean =>
        best.met === true
          ? d.met === true
          : reduced(d) >= STEERING.feasibility * reduced(best);
      for (let k: number = 0; k < STEERING.increases && !enough(step); ++k)
        grow();
    }
    // Their (5.14) (p. 10) asks the model's decrease to be a share of the
    // penalty times the step's reduction of the violation; a step that
    // reduces none asks nothing of the penalty.
    for (
      let k: number = 0;
      k < STEERING.increases &&
      reduced(step) > 0 &&
      step.predicted < STEERING.merit * mu * reduced(step);
      ++k
    )
      grow();
    return { mu, model, step };
  }
}
