/**
 * A network curve of a surface rig, from `rigAutoMovieSurfaceCurve`,
 * re-evaluated per pose into its own buffers.
 *
 * `update` runs once per pose after the sweeps and bones it reads; the queries
 * then write into caller arrays without allocation.
 */
export interface IAutoMovieSurfaceCurveRig {
  /** Re-evaluate the curve for the current pose. */
  update(): void;

  /**
   * Write the point at a chord-length share.
   *
   * @param t Share, 0 to 1
   * @param out Receives three numbers
   * @param at Offset into `out`
   */
  point(t: number, out: Float64Array, at: number): void;

  /**
   * Write the unit surface normal a bridge leaving the curve uses at a share.
   *
   * @param t Share, 0 to 1
   * @param out Receives three numbers
   * @param at Offset into `out`
   * @throws Error when the curve declares no normal
   */
  normal(t: number, out: Float64Array, at: number): void;

  /**
   * Write the unit direction a bridge leaves the curve along.
   *
   * @param out Receives three numbers
   * @param at Offset into `out`
   * @throws Error when the curve declares no direction
   */
  direction(out: Float64Array, at: number): void;
}
