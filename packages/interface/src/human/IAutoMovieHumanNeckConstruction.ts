import type { IAutoMovieViewLoft } from "../construction/IAutoMovieViewLoft";
import type { IAutoMovieViewPart } from "../construction/IAutoMovieViewPart";

/**
 * The restricted original neck source together with the complete engine loft
 * outcome.
 *
 * The interface package owns these declarations; AutoMovieHumanNeckConstruction
 * in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanNeckConstruction {
  /**
   * The actual adapter input and every engine outcome.
   *
   * Keeps original source identity separate from surviving loft sections and
   * nullable final chain. A view/result pair exposes both source comparison and
   * all admission diagnostics. No failed station or null chain is promoted to
   * complete geometry. States borrowing and open-interval scope. This result
   * type performs no computation. This result type coordinates no requests. The
   * body owns the result and borrowed source for one definition lifetime.
   */
  export interface IOutput {
    /**
     * Restricted source records and the original axis on the internal interval,
     * calibration mm.
     */
    part: IAutoMovieViewPart;

    /**
     * Complete engine loft outcome, including every omitted section and
     * nullable chain.
     */
    loft: IAutoMovieViewLoft.IResult;
  }
}
