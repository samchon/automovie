import type {
  AutoMovieHumanSex as AutoMovieHumanSexType,
  IAutoMovieHumanEar,
  IAutoMovieHumanEarPlace,
} from "@automovie/interface";

import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";

/**
 * The auricle's top above tragion. HeadLane places the ear using this height
 * and the person's tragion from AutoMovieHumanHeadArcs.
 *
 * Source: ANSUR 1988 (Gordon et al. 1989; 2,208 women and 1,774 men) takes the
 * ear length above tragion with the ear length; the line by sex
 * (`test_human_survey_head_arcs`): 6.96 + 0.3645 L in women and 8.12 + 0.3673 L
 * in men, R2 0.34 and 0.40, residual SD 1.9 mm; the means are 28.7 (2.3) and
 * 31.9 (2.5) mm. The retained ANSUR survey and the public Cho CT ear length use
 * distinct protocols; this file does not establish their orientation
 * equivalence.
 *
 * @evidence contracts/common.md#principled-implementation Applies the ANSUR length regression with its stated public-length protocol limit.
 * @evidence contracts/common.md#clear-and-simple-design Owns the regression and its scalar conversion; head builders own their frame and auricular course.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no observation, fit, asymmetric compensation or claim that the private depth ratio is a published concha protocol.
 * @evidence contracts/common.md#meaningful-documentation Gives the source, units, regression uncertainty and current reader.
 * @evidence contracts/performance.md#efficient-algorithms Fixed sex lookup and scalar affine/product conversions take constant time and space.
 * @evidence contracts/performance.md#reuse-equivalent-work All head readers share the same module coefficients; no generated geometry or input-dependent result cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fixed regression coefficients live for the module instance. Numeric evaluation retains no call state.
 */
export namespace AutoMovieHumanEarPlace {
  /** The line on the ear length, women and men, mm. */
  export const ABOVE_TRAGION_ON_LENGTH: IAutoMovieHumanEarPlace.AboveTragionOnLength =
    [
      { a: 6.96, b: 0.3645 },
      { a: 8.12, b: 0.3673 },
    ];

  /**
   * The ear's top above the tragion.
   *
   * @param ear The ear's measures.
   * @param sex The person's sex.
   * @returns Height of the auricle's top over the tragion, mm.
   * @evidence contracts/common.md#principled-implementation Evaluates the sex-specific ANSUR affine regression on supplied ear length; transferring the public Cho protocol to that predictor remains the namespace's stated limitation.
   * @evidence contracts/common.md#clear-and-simple-design Reads one coefficient pair and returns one height for HeadLane without owning the head frame.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Applies no reference-fit offset, clamp or side-specific compensation.
   * @evidence contracts/common.md#meaningful-documentation Names the predictor, millimetres, population and unresolved protocol transfer.
   * @evidence contracts/performance.md#efficient-algorithms One fixed lookup, multiplication and addition use constant time and space.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A scalar affine expression coordinates no cross-request or effectful work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows one module coefficient pair and returns a scalar without retaining the input ear.
   */
  export function aboveTragion(
    ear: IAutoMovieHumanEar,
    sex: AutoMovieHumanSexType,
  ): number {
    const fit: { readonly a: number; readonly b: number } =
      ABOVE_TRAGION_ON_LENGTH[sex === AutoMovieHumanSex.Female ? 0 : 1];
    return fit.a + fit.b * ear.length;
  }
}
