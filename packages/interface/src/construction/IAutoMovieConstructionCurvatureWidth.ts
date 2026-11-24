/**
 * A chord from a join's curve to one rail as a share of the tighter radius the rail turns on: `share / max(|k|, kappa_g)`, `k` the normal curvature of the rail's surface in the direction square to the curve in its tangent plane at the traced point and, where the rail offsets square to the curve (the host's always, the part's unless the curve uses the part's phase), `kappa_g` the curve's geodesic curvature in that surface, positive where the curve turns toward the rail; capped at `cap` and, where `end` is given, at that share of the station distance from the traced point to the rail surface's nearer end.
 *
 * A square offset of the curve at distance `d` moves along it at `1 - kappa_g d` times the curve's speed, so past `1 / kappa_g` it runs backward and folds the blend however gentle the surface is across the curve: a contact that rounds a tight corner of the part narrows its rail there.
 *
 * A rail placed farther round a surface than its radius of curvature in that direction turns past the surface's side and folds the blend. A share below one bounds the sampled width in that direction. The cap bounds the chord where the surface is flat across the curve (`k` near zero). The engine interpolates positive traced widths with C2 continuity and keeps the interpolant in their sampled range. This does not establish the local curvature bound between samples.
 *
 * A surface that ends near the curve (a dome closing on its pole, a short part) leaves its rail no room past that end however gentle its curvature: `end` bounds the chord by a share of the station distance to the nearer end, so the rail stays on the surface as it approaches a pole.
 *
 * Engine admission: `share` inside `(0, 1)`; `cap` positive; `end`, when given, inside `(0, 1)`.
 */
export interface IAutoMovieConstructionCurvatureWidth {
  /** Discriminator. */
  type: "curvature";

  /** The chord's share of the radius of curvature across the curve, inside `(0, 1)`. */
  share: number;

  /** The largest chord, metres, positive. */
  cap: number;

  /** The chord's share of the station distance from the traced point to the rail surface's nearer end, inside `(0, 1)`; null for no end bound. */
  end: number | null;
}
