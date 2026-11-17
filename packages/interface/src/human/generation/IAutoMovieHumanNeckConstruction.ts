import type { IAutoMovieViewLoft } from "../../construction/IAutoMovieViewLoft";
import type { IAutoMovieViewPart } from "../../construction/IAutoMovieViewPart";

/** Type contracts exchanged by AutoMovieHumanNeckConstruction; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanNeckConstruction {
  /**
   * The actual adapter input and every engine outcome.
   *
   * @evidence contracts/common.md#principled-implementation Keeps original source identity separate from surviving loft sections and nullable final chain.
   * @evidence contracts/common.md#clear-and-simple-design A view/result pair exposes both source comparison and all admission diagnostics.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No failed station or null chain is promoted to complete geometry.
   * @evidence contracts/common.md#meaningful-documentation States borrowing and open-interval scope.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result type performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This result type coordinates no requests.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The body owns the result and borrowed source for one definition lifetime.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The actual adapter input and every engine outcome.
   * @evidence contracts/development/design.md#principled-representation `part`: Restricted source records and the original axis on the internal interval, calibration mm. `loft`: Complete engine loft outcome, including every omitted section and nullable chain.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanNeckConstruction.generate. Also types AutoMovieHumanBodySources.neck, AutoMovieHumanHeadCanonical.lower.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `part`, `loft`; callers supply the complete record.
   */
  export interface IOutput {
    /** Restricted source records and the original axis on the internal interval, calibration mm. */
    part: IAutoMovieViewPart;

    /** Complete engine loft outcome, including every omitted section and nullable chain. */
    loft: IAutoMovieViewLoft.IResult;
  }
}
