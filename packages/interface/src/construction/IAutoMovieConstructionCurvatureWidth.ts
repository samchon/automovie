/**
 * A chord from a join's curve to one rail as a share of that surface's radius of curvature across the curve: `share / |k|`, `k` the normal curvature of the rail's surface in the direction square to the curve in its tangent plane at the traced point, capped at `cap`.
 *
 * A rail placed farther round a surface than its radius of curvature in that direction turns past the surface's side and folds the blend, at any scale. A share below one keeps every rail inside that radius wherever the curve runs: a small part's own tight curvature (a lip's or a lid's long-axis end) narrows its rail there and lets it widen where the part is flat. The cap bounds the chord where the surface is flat across the curve (`k` near zero). The engine evaluates the law at every traced point and reads it between them by the periodic cubic B-spline through those values, C2 round the loop.
 *
 * Engine admission: `share` inside `(0, 1)`; `cap` positive.
 *
 * @evidence contracts/common.md#principled-implementation The normal curvature `k = II(d, d) / I(d, d)` (Euler, Meusnier) of the surface in the rail's direction `d` is the inverse radius of the circle the surface follows there, so a chord a share of that radius cannot carry the rail past the surface's turn whatever the part's size.
 * @evidence contracts/common.md#clear-and-simple-design A share and a cap state the law; the radius comes from the surface, not from another field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The width follows the surface's own curvature; no floor widens a rail toward a fold and no seam drops to a lower continuity to hide one.
 * @evidence contracts/common.md#meaningful-documentation States the formula, the curvature's direction, why a share below one keeps the rail inside, the cap, where it is evaluated and interpolated, and the admission.
 */
export interface IAutoMovieConstructionCurvatureWidth {
  /** Discriminator. */
  type: "curvature";

  /** The chord's share of the radius of curvature across the curve, inside `(0, 1)`. */
  share: number;

  /** The largest chord, metres, positive. */
  cap: number;
}
