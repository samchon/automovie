import type { IAutoMovieConvexSupportLoft } from "../model/IAutoMovieConvexSupportLoft";
import type { IAutoMovieRecoveryDimensionScales } from "./IAutoMovieRecoveryDimensionScales";
import type { IAutoMovieRecoverySupportLoftCoverage } from "./IAutoMovieRecoverySupportLoftCoverage";

/**
 * Source-independent finite-view support approximation with editable dimensions.
 * Cubic support offsets and oriented planes generate a convex section hull;
 * they do not establish that the observed physical sections were convex.
 * Fitting and pixel uncertainty mean this is not a certified outer enclosure.
 * Width/depth scale X/Z about the frame origin; height scales about the first Y.
 *
 * @evidence contracts/common.md#principled-implementation Complete support coefficients and plane identities define the new boundary curves and surface independently of acquisition samples, with explicit uncertainty/coverage limits.
 * @evidence contracts/common.md#clear-and-simple-design One saved field and three independent coordinate scales own generation; dense observations, residuals and source hashes stay in separate fit evidence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No original image, mesh, normal, per-row polygon table, inferred cap or hidden-concavity claim enters this recipe.
 * @evidence contracts/common.md#meaningful-documentation States metre coefficients, scale anchors, finite-view convex interpretation, lack of enclosure certification, unknown ends/interior/concavity and supplied camera provenance.
 */
export interface IAutoMovieRecoverySupportLoft {
  /** Explicit section representation, without a physical convexity assertion. */
  family: "finite-view-convex-support";

  /** Fixed-object identity without an acquisition address. */
  objectId: string;

  /** Supplied metric-frame provenance. */
  frame: string;

  /** Fixed support planes and cubic offsets in metres. */
  loft: IAutoMovieConvexSupportLoft;

  /** Independent finite scale ratios in [0.25,4], at the documented anchors. */
  dimensions: IAutoMovieRecoveryDimensionScales;

  /** Conditional inference remains distinct from measured or visible physical shape. */
  coverage: IAutoMovieRecoverySupportLoftCoverage;
}
