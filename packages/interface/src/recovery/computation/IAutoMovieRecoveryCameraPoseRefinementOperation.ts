import type { IAutoMovieRecoveryCameraChartCreationOperation } from "../../index";

/**
 * Bounded local calibrated-pose least squares on a fixed correspondence subset.
 * Soft-L1 loss has caller-supplied pixel scale. A column-scaled original
 * Jacobian is rank-checked before a damped augmented least-squares step is
 * solved by SVD; damping cannot repair an unobservable local parameter
 * direction. Accepted steps update SO3 and the unit translation sphere.
 * Termination is local only.
 */

export namespace IAutoMovieRecoveryCameraPoseRefinementOperation {
  /**
   * Bounded local calibrated-pose least squares on a fixed correspondence
   * subset. Soft-L1 loss has caller-supplied pixel scale. A column-scaled
   * original Jacobian is rank-checked before a damped augmented least-squares
   * step is solved by SVD; damping cannot repair an unobservable local
   * parameter direction. Accepted steps update SO3 and the unit translation
   * sphere. Termination is local only.
   */

  export type Operation = (
    initial: {
      /**
       * Row-major 3 by 3 camera rotation in the operation's declared
       * source-to-camera convention.
       */
      rotation: readonly number[];

      /**
       * Camera translation in the operation's admitted reconstruction scale;
       * two-view direction alone has no metric length.
       */
      translation: readonly [number, number, number];
    },
    firstPoints: readonly (readonly [number, number])[],
    secondPoints: readonly (readonly [number, number])[],
    first: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    second: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    policy: {
      /** Positive pixel scale of the declared robust residual loss. */
      lossScalePx: number;

      /**
       * Smallest accepted normalized design singular ratio; dimensionless and
       * independent of residual magnitude.
       */
      minimumDesignRatio: number;

      /**
       * Explicit positive numerical iteration ceiling; exhaustion remains a
       * reported termination, not convergence.
       */
      maxIterations: number;

      /**
       * Explicit ceiling on Jacobi factorization sweeps; unresolved rank
       * remains a numerical refusal.
       */
      maxSweeps: number;
    },
  ) => {
    /**
     * Row-major 3 by 3 camera rotation in the operation's declared
     * source-to-camera convention.
     */
    rotation: number[];

    /**
     * Camera translation in the operation's admitted reconstruction scale;
     * two-view direction alone has no metric length.
     */
    translation: [number, number, number];

    /**
     * Row-major 3 by 3 fundamental matrix in the declared pixel charts;
     * homogeneous scale has no metric meaning.
     */
    fundamental: number[];

    /**
     * True only when the stated numerical termination predicate was met; it
     * does not certify scene geometry.
     */
    converged: boolean;

    /**
     * Predicate ending refinement; iteration-budget is an incomplete solve
     * rather than convergence.
     */
    termination: "gradient" | "step" | "cost" | "iteration-budget";

    /**
     * Actual numerical iterations attempted, including iterations without an
     * accepted update.
     */
    iterations: number;

    /**
     * Number of candidate updates actually accepted by the objective and
     * feasibility checks.
     */
    acceptedSteps: number;

    /**
     * Robust objective evaluated at the supplied initial pose under the
     * unchanged observation policy.
     */
    initialCost: number;

    /** The same robust objective evaluated at the last accepted pose. */
    finalCost: number;

    /**
     * Smallest admitted design singular ratio across attempted local pose
     * updates.
     */
    minimumLocalDesignRatio: number;
  };
}
