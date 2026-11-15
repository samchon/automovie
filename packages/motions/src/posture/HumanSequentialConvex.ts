/**
 * Penalty sequential convex optimisation with a trust region, the outer loop
 * of TrajOpt (Schulman et al. 2014, "Motion planning with sequential convex
 * optimization and convex collision checking", IJRR 33:1251, Algorithm 1)
 * over any iterate: the caller convexifies its problem about an iterate at a
 * penalty and solves the convex model within a region; this loop takes or
 * rejects the step by the ratio of the merit's actual to its predicted
 * decrease, moves the region by the caller's schedule (`ISchedule`), and
 * raises the penalty along the caller's ladder while the constraints are not
 * met. The merit is the objective plus the penalty times the constraints'
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
     * @param objective Whether the model holds the objective; false while the loop restores feasibility (`IOptions.restore`), when it is the penalised violation's alone.
     * @returns The model.
     */
    convexify(x: X, evaluation: E, penalty: number, radius: number, objective: boolean): IModel<X>;

    /**
     * Whether a reading meets the constraints, to the caller's tolerance.
     *
     * @param evaluation The reading.
     * @returns Whether it is feasible.
     */
    feasible(evaluation: E): boolean;
  }

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
     * Whether an infeasible start first has its feasibility restored: the
     * violation alone minimised (the objective out of the merit and the
     * model, at the first penalty, which then only scales the merit and does
     * not move its minimiser) until the constraints are met or the solve
     * settles, and only then the whole merit minimised from there over the
     * penalties, keeping the feasible point should that end infeasible: the
     * feasibility restoration phase of filter SQP (Fletcher and Leyffer
     * 2002, "Nonlinear programming without a penalty function", Math
     * Program 91:239) and SNOPT's feasible point first (Gill, Murray and
     * Saunders 2005, "SNOPT: an SQP algorithm for large-scale constrained
     * optimization", SIAM Review 47:99). A start the penalty cannot pull to
     * the constraints is then not driven up the whole ladder, and one that
     * cannot be made feasible is known as such after the restoration alone.
     * False when absent.
     */
    restore?: boolean;
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
  }

  /**
   * Minimise from an iterate.
   *
   * @param problem The problem.
   * @param start The first iterate.
   * @param options The schedule, the penalties, the rounds, a continued solve's penalty and region, and whether feasibility is restored first.
   * @returns The last iterate taken, its reading, its penalty and region, and whether the last convexification collapsed (with a restoration, the feasible point it reached when the whole merit's solve ends infeasible); the caller refuses an infeasible one by its own reading.
   */
  export function minimise<X, E extends IEvaluation>(problem: IProblem<X, E>, start: X, options: IOptions): IResult<X, E> {
    const first: E = problem.evaluate(start);
    if (options.restore !== true) return descend(problem, start, first, options, true);
    const known: IResult<X, E> = problem.feasible(first)
      ? { x: start, evaluation: first, penalty: options.penalties[0]!, radius: options.radius ?? options.schedule.trust, collapsed: false }
      : descend(problem, start, first, { schedule: options.schedule, penalties: [options.penalties[0]!], rounds: options.rounds }, false);
    if (!problem.feasible(known.evaluation)) return known;
    const solved: IResult<X, E> = descend(problem, known.x, known.evaluation, options, true);
    return problem.feasible(solved.evaluation) ? solved : known;
  }

  /** The loop from an iterate already read, over the penalties, the objective in the merit and the model or out of both. */
  function descend<X, E extends IEvaluation>(problem: IProblem<X, E>, start: X, first: E, options: IOptions, objective: boolean): IResult<X, E> {
    const s: ISchedule = options.schedule;
    let x: X = start;
    let current: E = first;
    let radius: number = options.radius ?? s.trust;
    let penalty: number = options.penalties[0]!;
    let collapsed: boolean = false;
    for (const mu of options.penalties) {
      // A continued solve keeps the penalty its iterate was reached at.
      if (options.from !== undefined && mu < options.from) continue;
      penalty = mu;
      for (let round: number = 0; round < options.rounds; ++round) {
        const model: IModel<X> = problem.convexify(x, current, mu, radius, objective);
        const merit: number = (objective ? current.objective : 0) + mu * current.violation;
        let taken: boolean = false;
        let settled: boolean = false;
        let told: boolean = false;

        // The region shrinks until a step is taken, it is too small to move
        // the iterate, or its tries run out.
        for (let attempt: number = 0; attempt < s.tries; ++attempt) {
          const step: IStep<X> = model.solve(radius);

          // A predicted decrease within the model's own accuracy is no
          // decrease the model can tell.
          if (step.accuracy !== undefined && step.predicted <= step.accuracy) {
            told = true;
            settled = true;
            break;
          }
          const next: E = problem.evaluate(step.trial);
          const ratio: number = step.predicted > 0 ? (merit - ((objective ? next.objective : 0) + mu * next.violation)) / step.predicted : -Infinity;
          if (ratio > s.eta) {
            model.taken?.();
            x = step.trial;
            current = next;
            taken = true;
            if (ratio < s.low) radius *= s.shrink;
            else if (ratio > s.high && (step.full || !s.boundary)) radius = Math.min(s.widest, radius * s.expand);

            // Settled: the model no longer improves the merit, or the step
            // no longer moves the iterate.
            settled = step.predicted < s.improved(merit) || step.length < s.least;
            break;
          }
          radius *= s.shrink;
          if (radius < s.least) {
            settled = true;
            break;
          }
        }
        collapsed = !taken && !told;
        if (!taken || settled) break;
      }
      if (problem.feasible(current)) break;
      radius = s.trust;
    }
    return { x, evaluation: current, penalty, radius, collapsed };
  }
}
