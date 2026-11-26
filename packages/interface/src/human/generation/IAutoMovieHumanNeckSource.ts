import type { IAutoMovieHumanHeadNeck } from "./IAutoMovieHumanHeadNeck";
import type { IAutoMovieHumanNeckPrior } from "./IAutoMovieHumanNeckPrior";

/**
 * Registered generating neck rows and their unchanged calibration-scale and
 * sampling metadata. Runtime construction and admission remain with
 * AutoMovieHumanNeckSource in Human.
 */
export namespace IAutoMovieHumanNeckSource {
  /** Shared source descriptors, not a loft result or final neck surface. */
  export interface IOutput {
    /** The original four rows in rising mean-height order. */
    rows: IRow[];

    /** Analytic top mean, adopted posterior point and endpoint dx/dy. */
    head: IAutoMovieHumanHeadNeck;

    /** Bottom generating row's analytic phase mean; not a named base-tape point. */
    bottom: [number, number, number];

    /** Calibration mm per world mm supplied by the body input boundary. */
    scale: number;

    /**
     * Retained phase resolution for projected normalization and the
     * transitional engine chain.
     */
    order: number;

    /**
     * Retained chain display density; not the density of the head's view
     * curves.
     */
    samples: number;

    /** Same rigid AP map applied to every generating row and head datum. */
    registration: NonNullable<IAutoMovieHumanHeadNeck["registration"]>;
  }

  /** One original generating row, with dimensions in calibration mm. */
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
