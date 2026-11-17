import type { IAutoMovieMotionHumanSequentialConvex } from "@automovie/interface";

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
  export function minimise<
    X,
    E extends IAutoMovieMotionHumanSequentialConvex.IEvaluation,
  >(
    problem: IAutoMovieMotionHumanSequentialConvex.IProblem<X, E>,
    start: X,
    options: IAutoMovieMotionHumanSequentialConvex.IOptions,
  ): IAutoMovieMotionHumanSequentialConvex.IResult<X, E> {
    const s: IAutoMovieMotionHumanSequentialConvex.ISchedule = options.schedule;
    const steer: boolean = options.steer === true;
    let x: X = start;
    let current: E = problem.evaluate(x);
    let radius: number = options.radius ?? s.trust;
    let penalty: number = options.penalties[0]!;
    let collapsed: boolean = false;
    let reason: IAutoMovieMotionHumanSequentialConvex.Reason = "rounds";
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
        let model: IAutoMovieMotionHumanSequentialConvex.IModel<X> =
          problem.convexify(x, current, mu, radius, true);
        let pending: IAutoMovieMotionHumanSequentialConvex.IStep<X> | undefined;
        if (steer) {
          const steered: {
            mu: number;
            model: IAutoMovieMotionHumanSequentialConvex.IModel<X>;
            step: IAutoMovieMotionHumanSequentialConvex.IStep<X>;
          } = steering(problem, x, current, mu, radius, model);
          mu = steered.mu;
          model = steered.model;
          pending = steered.step;
        }
        penalty = mu;
        const merit: number = current.objective + mu * current.violation;
        let taken: boolean = false;
        let settled: boolean = false;
        let told: boolean = false;
        let ended: IAutoMovieMotionHumanSequentialConvex.Reason = "rounds";

        // The region shrinks until a step is taken, it is too small to move
        // the iterate, or its tries run out.
        for (let attempt: number = 0; attempt < s.tries; ++attempt) {
          const step: IAutoMovieMotionHumanSequentialConvex.IStep<X> =
            pending ?? model.solve(radius);
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
  function steering<
    X,
    E extends IAutoMovieMotionHumanSequentialConvex.IEvaluation,
  >(
    problem: IAutoMovieMotionHumanSequentialConvex.IProblem<X, E>,
    x: X,
    current: E,
    penalty: number,
    radius: number,
    first: IAutoMovieMotionHumanSequentialConvex.IModel<X>,
  ): {
    mu: number;
    model: IAutoMovieMotionHumanSequentialConvex.IModel<X>;
    step: IAutoMovieMotionHumanSequentialConvex.IStep<X>;
  } {
    let mu: number = penalty;
    let model: IAutoMovieMotionHumanSequentialConvex.IModel<X> = first;
    let step: IAutoMovieMotionHumanSequentialConvex.IStep<X> =
      model.solve(radius);
    const reduced: (
      d: IAutoMovieMotionHumanSequentialConvex.IStep<X>,
    ) => number = (
      d: IAutoMovieMotionHumanSequentialConvex.IStep<X>,
    ): number => {
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
      const best: IAutoMovieMotionHumanSequentialConvex.IStep<X> = problem
        .convexify(x, current, mu, radius, false)
        .solve(radius);
      const enough: (
        d: IAutoMovieMotionHumanSequentialConvex.IStep<X>,
      ) => boolean = (
        d: IAutoMovieMotionHumanSequentialConvex.IStep<X>,
      ): boolean =>
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
