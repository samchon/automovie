import type { IAutoMovieSource } from "./IAutoMovieSource";
import type { IAutoMovieViewSection } from "./IAutoMovieViewSection";

/** Data and callback contracts shared by the ViewSectionRange operations. */
export namespace IAutoMovieViewSectionRange {
  /**
   * One actual common-shoulder candidate evaluated for a native girth solve.
   * Its source retains measured length and its fault records the producer's
   * admission result.
   */
  export interface ITrial {
    /** Actual prepared and measured native source for this shoulder candidate. */
    source: IAutoMovieSource;

    /**
     * Original candidate refusal text, or null when the measured source passed
     * admission.
     */
    fault: string | null;
  }

  /**
   * Call-owned native girth trial reader with a discovered local bracket or
   * already accepted ellipse candidate. Repeated reads of the same common
   * shoulder use that solve's prepared trial.
   */
  export interface IFamily {
    /**
     * Local admitted samples bracketing the target, or null when a bracket was
     * unavailable or the ellipse already passed.
     */
    range: IAutoMovieViewSection.IRange | null;

    /**
     * Measured ellipse candidate whose absolute girth residual is at most 10⁻⁶
     * millimetres.
     */
    accepted?: IAutoMovieViewSectionRange.ITrial;

    /**
     * Prepare and read the actual trial at a dimensionless common shoulder.
     * Within this family a repeated key returns the prior trial.
     */
    at(shoulder: number): IAutoMovieViewSectionRange.ITrial;
  }
}
