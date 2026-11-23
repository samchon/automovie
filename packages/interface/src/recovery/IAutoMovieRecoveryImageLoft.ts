import type { IAutoMovieEllipticLoft } from "../model/IAutoMovieEllipticLoft";
import type { IAutoMovieRecoveryDimensionScales } from "./IAutoMovieRecoveryDimensionScales";
import type { IAutoMovieRecoveryImageLoftCoverage } from "./IAutoMovieRecoveryImageLoftCoverage";

/**
 * Compact source-independent image-loft recipe, with explicit family
 * assumptions. Source images, row samples, masks, reference mesh and fitted
 * residuals belong to separate evidence records and are unnecessary for
 * generation. Width/depth edits scale X/Z about the supplied frame origin;
 * height scales Y about the first saved station. Each positive scale preserves
 * the other two axis extents.
 */
export interface IAutoMovieRecoveryImageLoft {
  /** Explicit supported hypothesis rather than unrestricted topology. */
  family: "aligned-elliptical-sections";

  /** Object identity without a source address. */
  objectId: string;

  /** Supplied metric-frame provenance, without acquisition paths. */
  frame: string;

  /** Generating coefficients in metres, before independent edits. */
  loft: IAutoMovieEllipticLoft;

  /**
   * Finite positive ratios in [0.25, 4], independently editable about the
   * documented anchors.
   */
  dimensions: IAutoMovieRecoveryDimensionScales;

  /** A fitting success never turns unseen surfaces into measurements. */
  coverage: IAutoMovieRecoveryImageLoftCoverage;
}
