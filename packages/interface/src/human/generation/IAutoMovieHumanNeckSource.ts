import type { IAutoMovieHumanHeadNeck } from "./IAutoMovieHumanHeadNeck";

/**
 * Registered neck section descriptors with calibration scale and sampling
 * metadata.
 */
export namespace IAutoMovieHumanNeckSource {
  /** Shared source descriptors, not a loft result or final neck surface. */
  export interface IOutput {
    /** Four samples of the circular taper in rising centre-height order. */
    rows: IRow[];

    /** Normal plane origin, registered C7 point and estimated axis slope. */
    head: IAutoMovieHumanHeadNeck;

    /** Bottom generating row's centre in the internal trunk overlap. */
    bottom: [number, number, number];

    /** Calibration mm per world mm supplied by the body input boundary. */
    scale: number;

    /** Ring order of the shared head-mass sampling policy. */
    order: number;

    /**
     * Retained chain display density; not the density of the head's view
     * curves.
     */
    samples: number;

    /** AP translation that registers the section frame at the supplied C7 datum. */
    registration: NonNullable<IAutoMovieHumanHeadNeck["registration"]>;
  }

  /** One original generating row, with dimensions in calibration mm. */
  export interface IRow {
    /** Analytic section coefficients in the same phase as the original outline. */
    ring: {
      /** Dimensionless forward cosines, starting at the mean. */
      x: readonly number[];

      /** World-millimetre height cosines, starting at the mean. */
      y: readonly number[];

      /** Dimensionless lateral sines, starting at the first harmonic. */
      z: readonly number[];
    };

    /** Section centre in calibration mm. */
    origin: [number, number, number];

    /** Lateral harmonic scale, calibration mm. */
    width: number;

    /** Forward harmonic scale, calibration mm. */
    depth: number;

    /** Calibration mm per world mm, applied to y harmonics. */
    scale: number;
  }
}
