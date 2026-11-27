import type { IAutoMovieLoftChain } from "../construction/IAutoMovieLoftChain";
import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Original chain addresses and evaluated candidates of a bounded anatomical
 * phase search.
 *
 * The interface package owns these declarations; AutoMovieHumanFootCourse in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanFootCourse {
  /**
   * Exact source chain and material address before a display ring exists.
   *
   * Names the actual chain and its calibration-mm station directly. The pair
   * identifies one source course without a fabricated ring. Contains no
   * world-height or old station-index substitute. Distinguishes the source
   * chain reference and material station units. An address type owns no
   * algorithm. Query functions determine sampler reuse. The display query
   * borrows the chain; the address owns no external handle.
   */
  export interface IAddress {
    /** Source chain. */
    chain: IAutoMovieLoftChain;

    /** Calibration-mm station. */
    station: number;
  }

  /**
   * The best evaluated point of a bounded phase search, not a continuous
   * global-minimum guarantee.
   *
   * Retains the lowest actually evaluated score with that source point and
   * phase. Three values expose exactly what the bounded search observed. Does
   * not present an unevaluated interpolation or local refinement as a certified
   * global minimum. States phase, point units and objective-score meaning. This
   * result declaration has no algorithm. The minimum query owns search work.
   * The caller owns the fixed-size result and sampled point.
   */
  export interface IMinimum {
    /** Material phase, radians. */
    phase: number;

    /** Actual source point, calibration mm. */
    point: AutoMovieVector3Tuple;

    /** Value of the anatomical site objective. */
    score: number;
  }

  /**
   * The score argument of AutoMovieHumanFootCourse.minimum. Sample an objective
   * at 64 phases and refine its best bracket by 40 golden-section steps.
   * Returns the lowest score among those evaluations. An arbitrary objective
   * need not be unimodal, so neither the bracket nor the global minimum is
   * certified. The caller names a display objective; no loft point is moved.
   */
  export type MinimumScore = (point: AutoMovieVector3Tuple) => number;
}
