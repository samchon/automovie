import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Common-root geometric reach projection inputs and unresolved support-ball
 * excess.
 */
export namespace IAutoMovieProjectPhysicalSupportReach {
  /**
   * Reach balls and a common-root travel budget for bounded geometric seed
   * projection.
   *
   * Origins, fixed targets, radii and translation limits are world metres;
   * iterations is an integer in [1,64] and tolerance is nonnegative metres.
   * projectPhysicalSupportReach borrows support geometry and allocates a
   * translation without changing goals or a simulated body. The producer checks
   * finite inputs, positive radii and valid work limits. Empty supports yield
   * zero translation/excess and convergence; incompatible balls may leave a
   * nonzero residual.
   */
  export type IInput = {
    /**
     * Current limb origins, independent goals and positive maximum reach,
     * metres.
     */
    supports: readonly {
      /** Current world joint. */
      origin: IAutoMovieVector3;

      /** Fixed world endpoint. */
      target: IAutoMovieVector3;

      /** Maximum straight reach, metres. */
      radius: number;
    }[];

    /** Nonnegative common root travel cap, metres. */
    maximumTranslation: number;

    /** Projection sweeps, integer 1..64. */
    iterations: number;

    /** Nonnegative residual allowance, metres. */
    tolerance: number;
  };

  /**
   * Common-root seed translation and the remaining worst support-reach
   * violation.
   *
   * Translation is a world displacement in metres bounded by
   * maximumTranslation; maximumExcess is the nonnegative worst original
   * reach-ball excess. projectPhysicalSupportReach allocates the result without
   * moving the supplied origins or targets; consumers decide whether to use the
   * seed. converged means maximumExcess <= the declared tolerance, not
   * successful native movement or a proof of globally optimal translation.
   */
  export type IResult = {
    /**
     * New world displacement in metres to add equally to all limb origins; norm
     * is capped by maximumTranslation.
     */
    translation: IAutoMovieVector3;

    /**
     * Largest positive distance beyond any original support radius after
     * translation, metres; zero for no supports.
     */
    maximumExcess: number;

    /**
     * Whether maximumExcess is at most the requested tolerance; false retains
     * the best produced seed and its unresolved violation.
     */
    converged: boolean;
  };
}
