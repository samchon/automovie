import type { IAutoMovieEllipticLoftSpan } from "./IAutoMovieEllipticLoftSpan";

/**
 * Parallel elliptical sections driven by piecewise cubic Bernstein profiles.
 * The local section plane is XZ and the physical station is Y, all in metres.
 * This family assumes aligned ellipse axes and describes an open lateral surface.
 * End caps and hidden interior shape require separate observations.
 *
 * @evidence contracts/common.md#principled-implementation Four scalar Bernstein profiles and physical span endpoints define one section family independently of tessellation or source samples.
 * @evidence contracts/common.md#clear-and-simple-design One ordered span list owns both surface generation and construction evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coefficients are generating controls rather than interpolation samples; no mesh, source normals, inferred cap or specimen identity enters the recipe.
 * @evidence contracts/common.md#meaningful-documentation States metre units, profile ordering, local axes, aligned-section premise, continuity ownership and open-end semantics.
 */
export interface IAutoMovieEllipticLoft {
  /** Increasing, adjacent physical Y intervals; neighbours share endpoint values exactly. */
  spans: IAutoMovieEllipticLoftSpan[];
}
