/**
 * The texels of one eye texture that lie on an iris disc, produced by
 * `rasterizeHumanFaceIrisTexels` and painted by the iris pigment rule.
 * The three arrays are parallel, one entry per kept texel.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Lists which texels of an eye texture are that eye's iris, located by geometry.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-iris Carries each kept texel's index, polar angle and azimuth for the pigment rule.
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
