/**
 * The texels of one eye texture that lie on an iris disc, produced by
 * `rasterizeHumanFaceIrisTexels` and painted by the iris pigment rule.
 * The three arrays are parallel, one entry per kept texel.
 *
 *
 * @evidence contracts/common.md#principled-implementation Parallel pixel indices and polar-angle arrays retain the same admitted neutral raster population.
 * @evidence contracts/common.md#clear-and-simple-design rasterizeHumanFaceIrisTexels produces correspondence reused by texture preparation and painting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The list describes selected surface texels rather than inferring anatomy from pixel colour.
 * @evidence contracts/common.md#meaningful-documentation Fields state row-major indices and radian theta/phi alignment.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceIrisTexels is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceIrisTexels declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceIrisTexels itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
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
