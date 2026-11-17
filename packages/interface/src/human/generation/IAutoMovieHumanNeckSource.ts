import type { IAutoMovieHumanHeadNeck } from "./IAutoMovieHumanHeadNeck";
import type { IAutoMovieHumanNeckPrior } from "./IAutoMovieHumanNeckPrior";

/** Type contracts exchanged by AutoMovieHumanNeckSource; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanNeckSource {
  /** Shared source descriptors, not a loft result or final neck surface.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Shared source descriptors, not a loft result or final neck surface.
   * @evidence contracts/development/design.md#principled-representation `rows`: The original four rows in rising mean-height order. `head`: Analytic top mean, adopted posterior point and endpoint dx/dy. `bottom`: Bottom generating row's analytic phase mean; not a named base-tape point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanNeckSource.of. Read by AutoMovieHumanNeckConstruction.generate, AutoMovieHumanNeckConstruction.define, AutoMovieHumanHeadLane.create. Also types AutoMovieHumanBodySources.neckSource, AutoMovieHumanHeadCanonical.lower.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `rows`, `head`, `bottom`, `scale`, `order`, `samples`, `registration`; callers supply the complete record.
   */
  export interface IOutput {
    /** The original four rows in rising mean-height order. */
    rows: IRow[];

    /** Analytic top mean, adopted posterior point and endpoint dx/dy. */
    head: IAutoMovieHumanHeadNeck;

    /** Bottom generating row's analytic phase mean; not a named base-tape point. */
    bottom: [number, number, number];

    /** Calibration mm per world mm supplied by the body input boundary. */
    scale: number;

    /** Retained phase resolution for projected normalization and the transitional engine chain. */
    order: number;

    /** Retained chain display density; not the density of the head's view curves. */
    samples: number;

    /** Same rigid AP map applied to every generating row and head datum. */
    registration: NonNullable<IAutoMovieHumanHeadNeck["registration"]>;
  }

  /** One original generating row, with dimensions in calibration mm.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One original generating row, with dimensions in calibration mm.
   * @evidence contracts/development/design.md#principled-representation `ring`: Unmodified dimensionless x/z and millimetre y harmonics. `origin`: Baseline forward and vertical translation before harmonic offsets. `width`: Lateral harmonic scale, calibration mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanNeckSource.point, AutoMovieHumanNeckSource.mean. Also types AutoMovieHumanNeckSource.rows, AutoMovieHumanNeckSource.top.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `ring`, `origin`, `width`, `depth`, `scale`; callers supply the complete record.
   */
  export interface IRow {
    /** Unmodified dimensionless x/z and millimetre y harmonics. */
    ring: IAutoMovieHumanNeckPrior.IRing;

    /** Baseline forward and vertical translation before harmonic offsets. */
    origin: [number, number, number];

    /** Lateral harmonic scale, calibration mm. */
    width: number;

    /** Forward harmonic scale, calibration mm. */
    depth: number;

    /** Calibration mm per world mm, applied to y harmonics. */
    scale: number;
  }
}
