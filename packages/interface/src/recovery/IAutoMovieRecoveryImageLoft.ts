import type { IAutoMovieEllipticLoft } from "../model/IAutoMovieEllipticLoft";
import type { IAutoMovieRecoveryDimensionScales } from "./IAutoMovieRecoveryDimensionScales";
import type { IAutoMovieRecoveryImageLoftCoverage } from "./IAutoMovieRecoveryImageLoftCoverage";

/**
 * Compact source-independent image-loft recipe, with explicit family assumptions.
 * Source images, row samples, masks, reference mesh and fitted residuals belong to
 * separate evidence records and are unnecessary for generation. Width/depth
 * edits scale X/Z about the supplied frame origin; height scales Y about the
 * first saved station. Each positive scale preserves the other two axis extents.
 *
 * @evidence contracts/common.md#principled-implementation Piecewise cubic section coefficients and three independent axis scales define a reproducible open surface under an explicit aligned-ellipse prior.
 * @evidence contracts/common.md#clear-and-simple-design Generation authority, named semantic edit controls and coverage labels share one recipe while acquisition evidence remains outside it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The recipe carries no source image, dense measurement, triangle array, copied normal, hidden cap or learned completion and does not call an inferred lateral surface measured truth.
 * @evidence contracts/common.md#meaningful-documentation States coefficient units, axis-scale anchors, edit independence, source isolation and the limits of the inferred surface and unobserved ends/interior.
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

  /** Finite positive ratios in [0.25, 4], independently editable about the documented anchors. */
  dimensions: IAutoMovieRecoveryDimensionScales;

  /** A fitting success never turns unseen surfaces into measurements. */
  coverage: IAutoMovieRecoveryImageLoftCoverage;
}
