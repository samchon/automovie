/**
 * The texels of one eye texture that lie on an iris disc, produced by
 * `rasterizeHumanFaceIrisTexels` and painted by the iris pigment rule.
 * The three arrays are parallel, one entry per kept texel.
 *
 * @author Samchon
 */
export interface IHumanFaceIrisTexels {
  /** Texel index `y * width + x`, one per kept texel. */
  index: number[];

  /** Polar angle from the optical axis, radians. */
  theta: number[];

  /** Azimuth about the optical axis in (-pi, pi], radians. */
  phi: number[];
}
