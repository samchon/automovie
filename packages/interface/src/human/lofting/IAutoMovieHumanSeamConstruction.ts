/**
 * Seam coordinate jets and surface-metric directions, distinguishing geometric
 * continuity from parameter speed.
 *
 * The interface package owns these declarations; AutoMovieHumanSeam in Human
 * supplies their runtime values.
 */
export namespace IAutoMovieHumanSeamConstruction {
  /** Readings of one seam point: what the declared continuity is judged on. */
  export interface IMeasure {
    /** Distance between the two pieces' points, mm. */
    gap: number;

    /** Angle between tangents (curves) or normals (surfaces), radians. */
    angle: number;

    /**
     * Jump of the curvature vector (curves) or of the normal curvature across
     * the seam (surfaces), 1/mm.
     */
    curvature: number;
  }

  /** Largest readings a declared continuity accepts. */
  export interface ITolerance {
    /** Largest gap, mm. */
    gap: number;

    /** Largest angle, radians. */
    angle: number;

    /** Largest curvature jump, 1/mm. */
    curvature: number;
  }

  /**
   * Result of AutoMovieHumanSeam.arc. Unit tangent and curvature vector of a
   * curve from its first and second derivatives in any parameter: `T = d1 /
   * |d1|` and `kappa N = (d2 - (d2 . T) T) / |d1|^2`. A zero first derivative
   * is read as speed 1, so a degenerate end yields a zero tangent rather than
   * NaN. The operation order is the one the appendage strip has always used, so
   * its rows are unchanged bit for bit.
   *
   * @param d1 First derivative.
   * @param d2 Second derivative, in the same parameter.
   * @returns `[T, kappa N]`.
   */
  export type ArcResult = [number[], number[]];

  /**
   * Result of AutoMovieHumanSeam.adopt. A neighbour's parametric jet copied
   * from an owner's arclength jet (J1): `q_v = lambda T` and `q_vv = lambda^2
   * kappa N + mu T`. `lambda` is the neighbour's speed in mm per unit of its
   * own parameter at the seam, `mu` its tangential acceleration; neither
   * changes the geometry the neighbour meets, only how its parameter runs
   * through it.
   *
   * @param jet The owner's published jet.
   * @param lambda Parameter speed; positive for a regular copy, 0 only where
   *   the neighbour itself degenerates to a point (a zero-length strip edge).
   * @param mu Tangential acceleration; 0 leaves `q_vv` across the tangent.
   * @returns `[q, q_v, q_vv]`.
   */
  export type AdoptResult = [number[], number[], number[]];

  /**
   * Result of AutoMovieHumanSeam.ribbon. Cross derivatives of a ribbon leaving
   * an owner's surface across a seam (J4): `q_w = alpha D1 + beta c'` and `q_ww
   * = alpha^2 D2 + 2 alpha beta d_t D1 + beta^2 c''`.
   *
   * @param owner The owner's jet at the seam point: `along` is `c'`,
   *   `alongSecond` `c''`, `across` `D1`, `acrossSecond` `D2`, `twist` `d_t
   *   D1`.
   * @param alpha Share of the owner's cross derivative, positive so the ribbon
   *   leaves the owner instead of folding back into it.
   * @param beta Share of the seam's own tangent, the ribbon's lean along it.
   * @returns `[q_w, q_ww]`.
   */
  export type RibbonResult = [number[], number[]];

  /**
   * The metric argument of AutoMovieHumanSeam.square. A chart direction leaving
   * a curve on a surface square to it on the skin (J4 in the surface's chart):
   * `w = D1 + beta c'` with `beta = -<D1, c'> / <c', c'>` in the first
   * fundamental form `[E, F, G]` of the chart's two coordinates, so `w` is `D1`
   * with its part along the curve removed in the metric of the skin, not of the
   * chart. A chart whose coordinates differ in scale (phase in radians against
   * station in mm) turns a direction square in the chart far off square on the
   * skin; near where the curve runs along one coordinate the turned direction
   * then swings through a right angle within a tiny step. Here `alpha = 1`
   * keeps `w` on `D1`'s side of the curve.
   *
   * @param metric `[E, F, G]`: dot products of the surface's derivatives along
   *   the first and second chart coordinates.
   * @param cross `D1`, a chart direction across the curve on the side to leave
   *   toward.
   * @param along `c'`, the curve's chart tangent.
   * @returns `w` in the same chart coordinates.
   */
  export type SquareMetric = readonly [number, number, number];

  /**
   * The cross argument of AutoMovieHumanSeam.square. A chart direction leaving
   * a curve on a surface square to it on the skin (J4 in the surface's chart):
   * `w = D1 + beta c'` with `beta = -<D1, c'> / <c', c'>` in the first
   * fundamental form `[E, F, G]` of the chart's two coordinates, so `w` is `D1`
   * with its part along the curve removed in the metric of the skin, not of the
   * chart. A chart whose coordinates differ in scale (phase in radians against
   * station in mm) turns a direction square in the chart far off square on the
   * skin; near where the curve runs along one coordinate the turned direction
   * then swings through a right angle within a tiny step. Here `alpha = 1`
   * keeps `w` on `D1`'s side of the curve.
   *
   * @param metric `[E, F, G]`: dot products of the surface's derivatives along
   *   the first and second chart coordinates.
   * @param cross `D1`, a chart direction across the curve on the side to leave
   *   toward.
   * @param along `c'`, the curve's chart tangent.
   * @returns `w` in the same chart coordinates.
   */
  export type SquareCross = readonly [number, number];

  /**
   * The along argument of AutoMovieHumanSeam.square. A chart direction leaving
   * a curve on a surface square to it on the skin (J4 in the surface's chart):
   * `w = D1 + beta c'` with `beta = -<D1, c'> / <c', c'>` in the first
   * fundamental form `[E, F, G]` of the chart's two coordinates, so `w` is `D1`
   * with its part along the curve removed in the metric of the skin, not of the
   * chart. A chart whose coordinates differ in scale (phase in radians against
   * station in mm) turns a direction square in the chart far off square on the
   * skin; near where the curve runs along one coordinate the turned direction
   * then swings through a right angle within a tiny step. Here `alpha = 1`
   * keeps `w` on `D1`'s side of the curve.
   *
   * @param metric `[E, F, G]`: dot products of the surface's derivatives along
   *   the first and second chart coordinates.
   * @param cross `D1`, a chart direction across the curve on the side to leave
   *   toward.
   * @param along `c'`, the curve's chart tangent.
   * @returns `w` in the same chart coordinates.
   */
  export type SquareAlong = readonly [number, number];

  /**
   * Result of AutoMovieHumanSeam.square. A chart direction leaving a curve on a
   * surface square to it on the skin (J4 in the surface's chart): `w = D1 +
   * beta c'` with `beta = -<D1, c'> / <c', c'>` in the first fundamental form
   * `[E, F, G]` of the chart's two coordinates, so `w` is `D1` with its part
   * along the curve removed in the metric of the skin, not of the chart. A
   * chart whose coordinates differ in scale (phase in radians against station
   * in mm) turns a direction square in the chart far off square on the skin;
   * near where the curve runs along one coordinate the turned direction then
   * swings through a right angle within a tiny step. Here `alpha = 1` keeps `w`
   * on `D1`'s side of the curve.
   *
   * @param metric `[E, F, G]`: dot products of the surface's derivatives along
   *   the first and second chart coordinates.
   * @param cross `D1`, a chart direction across the curve on the side to leave
   *   toward.
   * @param along `c'`, the curve's chart tangent.
   * @returns `w` in the same chart coordinates.
   */
  export type SquareResult = [number, number];
}
