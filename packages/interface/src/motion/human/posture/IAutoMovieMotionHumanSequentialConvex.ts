/**
 * Penalty sequential convex optimisation with a box trust region: trajopt's
 * `sco::BasicTrustRegionSQP` (github.com/joschu/trajopt
 * `src/sco/optimizers.cpp` and `optimizers.hpp` at commit
 * 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c, BSD-2-Clause, Copyright (c) 2013,
 * John Schulman), the outer loop of TrajOpt (Schulman et al. 2014, "Motion
 * planning with sequential convex optimization and convex collision checking",
 * IJRR 33:1251).
 *
 * The caller convexifies its problem about an iterate at a merit coefficient
 * and solves the convex model inside a box about the iterate; the loop takes or
 * rejects each step by the ratio of the merit's exact to its modelled
 * improvement, shrinks or grows the box, and raises the coefficient while a
 * constraint is still violated past the tolerance. The merit is the costs plus
 * the coefficient times the constraints' summed violation, the l1 exact penalty
 * (Nocedal and Wright 2006, "Numerical Optimization", 2nd ed., section 17.2).
 */
export namespace IAutoMovieMotionHumanSequentialConvex {
  /**
   * An iterate's exact reading: sco's `results_.cost_vals` and
   * `results_.cnt_viols`, as the loop reads them.
   */
  export interface IEvaluation {
    /** The costs summed (`vecSum(cost_vals)`), in the merit's units. */
    objective: number;

    /**
     * The constraints' violations summed (`vecSum(cnt_viols)`), in the units
     * the coefficient weighs.
     */
    violation: number;

    /**
     * The greatest single constraint's violation (`vecMax(cnt_viols)`), in the
     * same units; zero for a problem with no constraint.
     */
    greatest: number;
  }

  /**
   * The convex model's solution inside a box: sco's trust-region trial
   * (`optimize`, `setTrustBoxConstraints` then `model_->optimize()`).
   */
  export interface IStep<X> {
    /**
     * The iterate the solution reaches (`new_x`, the problem's variables among
     * the model's), inside the caller's hard set.
     */
    trial: X;

    /**
     * The model's merit at the solution (`model_merit`: the convexified costs
     * plus the coefficient times the linearised constraints' violation), in the
     * same absolute units as `IEvaluation`.
     */
    merit: number;

    /**
     * Whether the convex solver could not solve the model (`status !=
     * CVX_SOLVED`); the solve then ends failed (`OPT_FAILED`). A solution
     * otherwise.
     */
    failed: boolean;
  }

  /**
   * The convex model about an iterate at one merit coefficient: the convexified
   * costs and the constraints as penalties at that coefficient
   * (`cntsToCosts`).
   */
  export interface IModel<X> {
    /**
     * Solve the model inside a box about its iterate.
     *
     * @param box The box's half-width in every variable (`trust_box_size_`), in
     *   the variables' units, intersected with their hard bounds.
     * @returns The solution.
     */
    solve(box: number): IAutoMovieMotionHumanSequentialConvex.IStep<X>;
  }

  /** The problem, as the caller reads it. */
  export interface IProblem<
    X,
    E extends IAutoMovieMotionHumanSequentialConvex.IEvaluation,
  > {
    /**
     * The point of the hard set nearest an iterate
     * (`OptProb::getClosestFeasiblePoint`).
     *
     * @param x The iterate.
     * @returns The nearest point inside the variables' hard bounds.
     */
    closest(x: X): X;

    /**
     * An iterate's exact reading.
     *
     * @param x The iterate.
     * @returns Its costs and violations, and whatever else the caller reads.
     */
    evaluate(x: X): E;

    /**
     * The convex model about an iterate (`convexifyCosts`,
     * `convexifyConstraints`, `cntsToCosts`).
     *
     * @param x The iterate.
     * @param evaluation Its exact reading.
     * @param coefficient The merit coefficient the constraints are priced at
     *   (`merit_error_coeff_`).
     * @returns The model.
     */
    convexify(
      x: X,
      evaluation: E,
      coefficient: number,
    ): IAutoMovieMotionHumanSequentialConvex.IModel<X>;
  }

  /**
   * The loop's parameters, sco's `BasicTrustRegionSQP` members, each in the
   * problem's own units.
   */
  export interface IParameters {
    /** The least ratio of exact to modelled improvement a step is taken at. */
    improveRatioThreshold: number;

    /** The box below which the solve has converged. */
    minTrustBoxSize: number;

    /** The modelled improvement below which the solve has converged. */
    minApproxImprove: number;

    /**
     * The modelled improvement, as a share of the merit, below which the solve
     * has converged.
     */
    minApproxImproveFrac: number;

    /** The SQP iterations at one merit coefficient at most. */
    maxIter: number;

    /** The box's factor on a step not taken. */
    trustShrinkRatio: number;

    /** The box's factor on a step taken. */
    trustExpandRatio: number;

    /** The greatest constraint violation at which the constraints are met. */
    cntTolerance: number;

    /** The merit coefficients solved at at most. */
    maxMeritCoeffIncreases: number;

    /** The factor each raise multiplies the merit coefficient by. */
    meritCoeffIncreaseRatio: number;

    /** The merit coefficient the solve starts at. */
    meritErrorCoeff: number;

    /** The box the solve starts with. */
    trustBoxSize: number;
  }

  /**
   * How a solve ended, sco's `OptStatus`: `converged` (`OPT_CONVERGED`, the
   * constraints met or the last coefficient's SQP converged),
   * `scoIterationLimit` (`OPT_SCO_ITERATION_LIMIT`, `maxIter` iterations at one
   * coefficient), `penaltyIterationLimit` (`OPT_PENALTY_ITERATION_LIMIT`, still
   * violated after every coefficient) or `failed` (`OPT_FAILED`, the convex
   * solver could not solve a model).
   */
  export type Status =
    | "converged"
    | "scoIterationLimit"
    | "penaltyIterationLimit"
    | "failed";

  /** A solve's result. */
  export interface IResult<X, E> {
    /** The last iterate taken (`results_.x`). */
    x: X;

    /** Its exact reading. */
    evaluation: E;

    /** How the solve ended (`results_.status`). */
    status: IAutoMovieMotionHumanSequentialConvex.Status;

    /** The merit coefficient it ended at (`merit_error_coeff_`). */
    coefficient: number;
  }
}
