import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadNeckCurves } from "./IAutoMovieHumanHeadNeckCurves";

/**
 * The placed head layout and original lower-neck definition, with explicit
 * closure demand and elapsed observations.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadNeckLayout
 * in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanHeadNeckLayout {
  /**
   * The same placed layout and original neck declarations, with observed stage
   * costs.
   */
  export interface IOutput {
    /** Existing head datums plus the original lower-neck curves, calibration mm. */
    readonly layout: IAutoMovieHumanHeadLayout;

    /** Independently available normal source and unresolved lower-family inputs. */
    readonly definition: IAutoMovieHumanHeadNeckCurves.IDefinition | null;

    /**
     * Successful lower closure owned by this exact definition; absent before
     * that explicit request.
     */
    readonly lowerClosure?: {
      /** Same actual normal declaration and lower constraint inputs. */
      readonly definition: IAutoMovieHumanHeadNeckCurves.IDefinition;

      /** Identical lower source published in layout.neck.curves. */
      readonly curves: IAutoMovieHumanHeadNeckCurves.IOutput;
    };

    /**
     * Synchronous elapsed observations, excluding later head work and lazy
     * queries.
     */
    readonly milliseconds: Readonly<{
      /** Existing selected-tragion placement, elapsed ms. */
      placement: number;

      /**
       * Complete unchanged normal/base-neck solves and source declarations,
       * elapsed ms.
       */
      neckOriginal: number;

      /**
       * Actual normal/native/base subintervals and query counts, or null
       * without a supplied base course.
       */
      neckWork: Readonly<IAutoMovieHumanHeadNeckCurves.IWork> | null;
    }>;
  }
}
