/**
 * Numerical data estimate for one replacement saved curve, independent of source-interior fidelity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Saved source-free curve identity. Upper numerical data estimate in millimetres; this is not a source-fit certificate.
 * @evidence contracts/development/design.md#principled-representation Upper numerical data estimate in millimetres; this is not a source-fit certificate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryCoefficientPublication share IAutoMovieRecoveryCoefficientOverride's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Upper numerical data estimate in millimetres; this is not a source-fit certificate.
 */

export interface IAutoMovieRecoveryCoefficientOverride {
 
 /** Saved source-free curve identity. */
  curveName: string;

 
 /** Upper numerical data estimate in millimetres; this is not a source-fit certificate. */
  dataUpperEstimateMm: number;
}
