import type { IAutoMovieEllipticLoftSpan } from "./IAutoMovieEllipticLoftSpan";

/**
 * Parallel elliptical sections driven by piecewise cubic Bernstein profiles.
 * The local section plane is XZ and the physical station is Y, all in metres.
 * This family assumes aligned ellipse axes and describes an open lateral surface.
 * End caps and hidden interior shape require separate observations.
 *
 * @evidence contracts/development/design.md#principled-representation Four scalar Bernstein profiles and physical span endpoints define one section family independently of tessellation or source samples.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One ordered span list owns both surface generation and construction evaluation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Coefficients are generating controls rather than interpolation samples; no mesh, source normals, inferred cap or specimen identity enters the recipe.
 * @evidence contracts/development/common.md#meaningful-documentation States metre units, profile ordering, local axes, aligned-section premise, continuity ownership and open-end semantics.
 */
export interface IAutoMovieEllipticLoft {
  /** Increasing, adjacent physical Y intervals; neighbours share endpoint values exactly. */
  spans: IAutoMovieEllipticLoftSpan[];
}
