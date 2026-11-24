import type { AutoMovieVector2Tuple } from "../../../geometry/AutoMovieVector2Tuple";
import type { IAutoMovieHumanNativeSiteReaches } from "./IAutoMovieHumanNativeSiteReaches";

/**
 * Public contracts for a measured native section.
 */
export namespace IAutoMovieHumanNativeSiteSection {
  /**
   * A site's measures as the section takes them.
   */
  export interface ISite {
    /** The point the reaches are measured from, in the section's chart, mm: where the skeleton crosses the section's plane. */
    centre: AutoMovieVector2Tuple;

    /** The reaches the given section was laid at. */
    from: IAutoMovieHumanNativeSiteReaches.IReaches;

    /** The person's reaches. */
    to: IAutoMovieHumanNativeSiteReaches.IReaches;

    /** The person's girth at the site, a taut tape's length, mm; absent, the shares stay. */
    girth?: number;
  }

  /**
   * A section solved at its site.
   */
  export interface ISolved {
    /** The section's field vector on the same layout. The given array itself when nothing moved. */
    values: readonly number[];

    /** The scalar the girth added to every fullness share's logit; zero where no girth was given or the tape already measured it. */
    fullness: number;
  }
}
