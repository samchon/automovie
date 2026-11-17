import type { IAutoMovieLoftChain } from "../../construction/IAutoMovieLoftChain";
import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanFootCourse; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootCourse {
  /**
   * Exact source chain and material address before a display ring exists.
   *
   * @evidence contracts/common.md#principled-implementation Names the actual chain and its calibration-mm station directly.
   * @evidence contracts/common.md#clear-and-simple-design The pair identifies one source course without a fabricated ring.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no world-height or old station-index substitute.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes the source chain reference and material station units.
   * @evidenceExclude contracts/performance.md#efficient-algorithms An address type owns no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Query functions determine sampler reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The display query borrows the chain; the address owns no external handle.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Exact source chain and material address before a display ring exists.
   * @evidence contracts/development/design.md#principled-representation `chain`: Source chain. `station`: Calibration-mm station.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanFootCourse.minimum, AutoMovieHumanFootCourse.course.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `chain`, `station`; callers supply the complete record.
   */
  export interface IAddress {
    /** Source chain. */
    chain: IAutoMovieLoftChain;

    /** Calibration-mm station. */
    station: number;
  }

  /**
   * The best evaluated point of a bounded phase search, not a continuous global-minimum guarantee.
   *
   * @evidence contracts/common.md#principled-implementation Retains the lowest actually evaluated score with that source point and phase.
   * @evidence contracts/common.md#clear-and-simple-design Three values expose exactly what the bounded search observed.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not present an unevaluated interpolation or local refinement as a certified global minimum.
   * @evidence contracts/common.md#meaningful-documentation States phase, point units and objective-score meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result declaration has no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The minimum query owns search work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the fixed-size result and sampled point.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The best evaluated point of a bounded phase search, not a continuous global-minimum guarantee.
   * @evidence contracts/development/design.md#principled-representation `phase`: Material phase, radians. `point`: Actual source point, calibration mm. `score`: Value of the anatomical site objective.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootCourse.minimum. Also types AutoMovieHumanFootCourse.best, AutoMovieHumanFootCourse.candidate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `phase`, `point`, `score`; callers supply the complete record.
   */
  export interface IMinimum {
    /** Material phase, radians. */
    phase: number;

    /** Actual source point, calibration mm. */
    point: AutoMovieVector3Tuple;

    /** Value of the anatomical site objective. */
    score: number;
  }

  /** The score argument of AutoMovieHumanFootCourse.minimum. Sample an objective at 64 phases and refine its best bracket by 40 golden-section steps.
  Returns the lowest score among those evaluations. An arbitrary objective
  need not be unimodal, so neither the bracket nor the global minimum is
  certified. The caller names a display objective; no loft point is moved.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Sample an objective at 64 phases and refine its best bracket by 40 golden-section steps.
 * @evidence contracts/development/design.md#principled-representation Sample an objective at 64 phases and refine its best bracket by 40 golden-section steps. The callable takes point and returns number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanFootCourse.MinimumScore is the canonical exchange used by AutoMovieHumanFootCourse.minimum.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanFootCourse.minimum for sample an objective at 64 phases and refine its best bracket by 40 golden-section steps.
 */
  export type MinimumScore = (point: AutoMovieVector3Tuple) => number;
}
