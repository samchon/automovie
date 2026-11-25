/**
 * One appendage: a chain whose end meets a closed root loop on its base chain
 * through a transition strip.
 *
 * The base is not lofted inside the loop. Between the loop on the base and the
 * appendage's end ring, a strip `T(t, w)` runs from the appendage (w = 0) to
 * the base (w = 1) as the quintic Hermite of the two curves, their cross
 * derivatives and their second cross derivatives, so the skin is continuous in
 * position, tangent plane and curvature across both edges (G2). Ring phase t of
 * the appendage's end and loop parameter t name the same strip column.
 */
export interface IAutoMovieHumanSurfaceAppendage {
  /** Appendage chain. */
  chain: string;

  /** End of the appendage chain that meets the root loop. */
  end: "bottom" | "top";

  /** Base chain the loop lies on. */
  base: string;

  /**
   * Root loop in the base's chart as a periodic cubic B-spline of M control
   * points `[s_0 .. s_{M-1}, t_0 .. t_{M-1}]`: station in mm and phase in
   * radians, the phases continuous (unwrapped) round the loop. Either turning
   * sense is accepted. With a winding, the phase is the winding times the loop
   * parameter plus this remainder.
   */
  root: number[];

  /**
   * Turn of the root loop's phase round the base's cap pole, for a loop that
   * winds once round it (a digit's or toe's on the palm's or the sole's cap):
   * the base is left out beyond the loop toward the pole. Absent means none:
   * the loop encloses its region of the chart.
   */
  winding?: 1 | -1;

  /**
   * Cross-derivative length of the strip at both edges as a share of the chord
   * between them: 1 lays the strip like a straight blend, more makes it
   * fuller.
   */
  reach: number;

  /**
   * Interior rows of the strip, from the appendage toward the base: each the
   * offsets of one row from the edges' quintic blend at its Greville abscissa,
   * in the blend's frame there (along the ring, the normal and their cross
   * product), as three periodic cubic B-splines in the ring phase of M control
   * points, `[a_0 .. a_{M-1}, b_0 .., c_0 ..]` in mm
   * (`AutoMovieHumanBodyStrip`). Absent means none: the strip is then the six
   * edge rows alone.
   */
  rows?: number[][];
}
