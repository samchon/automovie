/**
 * The cosine-weighted visibility one screen-space slice contributes to a
 * point's ground-truth-based ambient occlusion: the closed-form inner integral
 * of Jimenez, Wu, Pesce and Jarabo 2016 ("Practical real-time strategies for
 * accurate indirect occlusion", SIGGRAPH course "Physically Based Shading in
 * Theory and Practice", equation 10), the CPU reference of the renderer's
 * occlusion pass.
 *
 * A slice is the plane through the view direction and one screen direction.
 * Angles are measured in that plane from the view direction toward the screen
 * direction: `normal` is the angle of the surface normal projected into the
 * slice, and `low` and `high` the angles of the highest occluder on the
 * negative and positive side. Each horizon is first clamped to the hemisphere
 * about the normal, `normal ± π / 2`, and the slice then contributes `length ×
 * Σ (cos n + 2 h sin n − cos(2h − n)) / 4` over its two horizons, with `length`
 * the projected normal's length. Averaged over slices spread uniformly over the
 * half turn, the contributions estimate the cosine-weighted visible fraction of
 * the hemisphere: 1 for an open surface facing the view.
 *
 * @param normal Projected normal angle `n` in radians, within [-π/2, π/2].
 * @param length Length of the normal projected into the slice, within [0, 1].
 * @param low Horizon angle `h0` on the negative side, radians, at most `n`.
 * @param high Horizon angle `h1` on the positive side, radians, at least `n`.
 * @returns The slice's visibility.
 */
export function autoMovieSliceVisibility(
  normal: number,
  length: number,
  low: number,
  high: number,
): number {
  const n: number = normal;
  const h0: number = n + Math.max(low - n, -Math.PI / 2);
  const h1: number = n + Math.min(high - n, Math.PI / 2);
  const arc: (h: number) => number = (h: number): number =>
    (Math.cos(n) + 2 * h * Math.sin(n) - Math.cos(2 * h - n)) / 4;
  return length * (arc(h0) + arc(h1));
}
