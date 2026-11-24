import type { IAutoMovieMotionHumanSequentialConvex } from "@automovie/interface";

/**
 * Penalty sequential convex optimisation with a box trust region, ported line
 * for line from trajopt's `sco::BasicTrustRegionSQP::optimize`
 * (github.com/joschu/trajopt `src/sco/optimizers.cpp`, lines 220-400, at commit
 * 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c, BSD-2-Clause, Copyright (c) 2013,
 * John Schulman), the solver of TrajOpt (Schulman et al. 2014, IJRR 33:1251).
 *
 * The outer loop raises the merit coefficient by `meritCoeffIncreaseRatio` at
 * most `maxMeritCoeffIncreases` times while a constraint is violated past
 * `cntTolerance`. At each coefficient the SQP loop convexifies the problem once
 * per iteration and solves the model inside a box about the iterate, shrinking
 * the box by `trustShrinkRatio` while the exact improvement of the merit is
 * negative or falls under `improveRatioThreshold` of the modelled one, and
 * taking the step and growing the box by `trustExpandRatio` otherwise. The SQP
 * has converged when the modelled improvement falls under `minApproxImprove` or
 * under `minApproxImproveFrac` of the merit, or when the box falls under
 * `minTrustBoxSize`; `maxIter` iterations at one coefficient end the whole
 * solve. A model the convex solver cannot solve ends it failed.
 */
export namespace HumanSequentialConvex {
  /**
   * Sco's defaults (`BasicTrustRegionSQP::initParameters`, `optimizers.cpp`
   * lines 158-176 at the same commit), each in the problem's own units.
   */
  export const DEFAULTS: Readonly<IAutoMovieMotionHumanSequentialConvex.IParameters> =
    {
      improveRatioThreshold: 0.25,
      minTrustBoxSize: 1e-4,
      minApproxImprove: 1e-4,
      minApproxImproveFrac: -Infinity,
      maxIter: 50,
      trustShrinkRatio: 0.1,
      trustExpandRatio: 1.5,
      cntTolerance: 1e-4,
      maxMeritCoeffIncreases: 5,
      meritCoeffIncreaseRatio: 10,
      meritErrorCoeff: 10,
      trustBoxSize: 0.1,
    };

  /**
   * Minimise from an iterate (`BasicTrustRegionSQP::optimize`).
   *
   * @param problem The problem.
   * @param start The first iterate (`initialize`).
   * @param parameters The loop's parameters.
   * @returns The last iterate taken, its reading, how the solve ended and the
   *   merit coefficient it ended at.
   */
  export function minimise<
    X,
    E extends IAutoMovieMotionHumanSequentialConvex.IEvaluation,
  >(
    problem: IAutoMovieMotionHumanSequentialConvex.IProblem<X, E>,
    start: X,
    parameters: Readonly<IAutoMovieMotionHumanSequentialConvex.IParameters>,
  ): IAutoMovieMotionHumanSequentialConvex.IResult<X, E> {
    // x_ = prob_->getClosestFeasiblePoint(x_), then the first iteration's
    // evaluateConstraintViols and evaluateCosts.
    let x: X = problem.closest(start);
    let current: E = problem.evaluate(x);
    let coefficient: number = parameters.meritErrorCoeff;
    let box: number = parameters.trustBoxSize;

    // The merit adjustment loop.
    for (
      let increases: number = 0;
      increases < parameters.maxMeritCoeffIncreases;
      ++increases
    ) {
      const ended: ISqp<X, E> = sqp(
        problem,
        x,
        current,
        coefficient,
        box,
        parameters,
      );
      x = ended.x;
      current = ended.current;
      box = ended.box;

      // OPT_FAILED and OPT_SCO_ITERATION_LIMIT go to cleanup at once.
      if (ended.status !== "converged")
        return { x, evaluation: current, status: ended.status, coefficient };

      // penaltyadjustment: the constraints met to the tolerance end the
      // solve; otherwise the coefficient grows and the box is kept at least
      // as wide as a shrink from just above its least would leave it.
      if (current.greatest < parameters.cntTolerance)
        return { x, evaluation: current, status: "converged", coefficient };
      coefficient *= parameters.meritCoeffIncreaseRatio;
      box = Math.max(
        box,
        (parameters.minTrustBoxSize / parameters.trustShrinkRatio) * 1.5,
      );
    }
    return {
      x,
      evaluation: current,
      status: "penaltyIterationLimit",
      coefficient,
    };
  }

  /**
   * The SQP loop at one merit coefficient (`optimize`, lines 238-371): one
   * convexification per iteration, the trust-region loop inside it.
   */
  function sqp<X, E extends IAutoMovieMotionHumanSequentialConvex.IEvaluation>(
    problem: IAutoMovieMotionHumanSequentialConvex.IProblem<X, E>,
    from: X,
    reading: E,
    coefficient: number,
    width: number,
    parameters: Readonly<IAutoMovieMotionHumanSequentialConvex.IParameters>,
  ): ISqp<X, E> {
    let x: X = from;
    let current: E = reading;
    let box: number = width;
    for (let iter: number = 1; ; ++iter) {
      const model: IAutoMovieMotionHumanSequentialConvex.IModel<X> =
        problem.convexify(x, current, coefficient);
      while (box >= parameters.minTrustBoxSize) {
        const step: IAutoMovieMotionHumanSequentialConvex.IStep<X> =
          model.solve(box);
        if (step.failed) return { x, current, box, status: "failed" };
        const next: E = problem.evaluate(step.trial);
        const oldMerit: number =
          current.objective + coefficient * current.violation;
        const newMerit: number = next.objective + coefficient * next.violation;
        const approxMeritImprove: number = oldMerit - step.merit;
        const exactMeritImprove: number = oldMerit - newMerit;
        const meritImproveRatio: number =
          exactMeritImprove / approxMeritImprove;
        if (approxMeritImprove < parameters.minApproxImprove)
          return { x, current, box, status: "converged" };
        if (approxMeritImprove / oldMerit < parameters.minApproxImproveFrac)
          return { x, current, box, status: "converged" };
        else if (
          exactMeritImprove < 0 ||
          meritImproveRatio < parameters.improveRatioThreshold
        )
          box *= parameters.trustShrinkRatio;
        else {
          x = step.trial;
          current = next;
          box *= parameters.trustExpandRatio;
          break;
        }
      }
      if (box < parameters.minTrustBoxSize)
        return { x, current, box, status: "converged" };
      else if (iter >= parameters.maxIter)
        return { x, current, box, status: "scoIterationLimit" };
    }
  }
}

/** Where one coefficient's SQP loop left the solve. */
interface ISqp<X, E> {
  /** The iterate. */
  x: X;

  /** Its exact reading. */
  current: E;

  /** The box. */
  box: number;

  /** How the SQP loop ended. */
  status: IAutoMovieMotionHumanSequentialConvex.Status;
}
