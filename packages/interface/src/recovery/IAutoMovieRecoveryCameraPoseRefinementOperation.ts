import type { IAutoMovieRecoveryCameraChartCreationOperation } from "..";

/** Callable local refinement of a fixed calibrated pixel correspondence subset. */

export namespace IAutoMovieRecoveryCameraPoseRefinementOperation {
  /**
   * Refine rotation and the unit translation direction using signed Sampson
   * residuals at the supplied pixel loss scale. Check the undamped local design
   * before damping a trial step. Keep only strict decreases in the fixed-set
   * objective. Report iteration exhaustion as incomplete.
   */

  export type Operation = (
    initial: {
      /**
       * Nine row-major coefficients rotating first-camera axes into the second
       * camera.
       */
      rotation: readonly number[];

      /** Initial unit translation direction in second-camera axes. */
      translation: readonly [number, number, number];
    },
    firstPoints: readonly (readonly [number, number])[],
    secondPoints: readonly (readonly [number, number])[],
    first: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    second: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    policy: {
      /** Positive soft-L1 scale for each signed Sampson residual, in pixels. */
      lossScalePx: number;

      /**
       * Positive lower bound on the dimensionless smallest-to-largest
       * normalized original design ratio.
       */
      minimumDesignRatio: number;

      /** Positive work cap for one fixed-subset nonlinear optimizer. */
      maxIterations: number;

      /** Positive Jacobi sweep limit for each singular decomposition. */
      maxSweeps: number;
    },
  ) => {
    /** Refined proper rotation from first-camera to second-camera coordinates. */
    rotation: number[];

    /** Refined unit translation direction in second-camera coordinates. */
    translation: [number, number, number];

    /** Row-major calibrated pixel fundamental matrix of the selected pose. */
    fundamental: number[];

    /**
     * True when the fixed-subset fit stops on gradient, accepted step size or
     * cost improvement.
     */
    converged: boolean;

    /**
     * Recorded local stop reason. An iteration-budget stop reports unfinished
     * work.
     */
    termination: "gradient" | "step" | "cost" | "iteration-budget";

    /** Count of local trial steps, including rejected steps. */
    iterations: number;

    /**
     * Number of selected trial steps that strictly lowered the robust
     * objective.
     */
    acceptedSteps: number;

    /** Initial fixed-subset soft-L1 objective, in squared pixels. */
    initialCost: number;

    /**
     * Final value of the same objective at the last selected pose, in squared
     * pixels.
     */
    finalCost: number;

    /**
     * Smallest visited singular-value ratio of the weighted and column-scaled
     * undamped Jacobian.
     */
    minimumLocalDesignRatio: number;
  };
}
