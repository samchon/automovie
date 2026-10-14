/**
 * Where the iris of one eye lies on its globe, found from the globe's own
 * geometry by `locateHumanFaceIrisDisc` and consumed by the iris texel
 * rasterizer and pigment rule. Lengths are metres in the basis frame,
 * angles radians from the estimated optical axis. The limbus uses a
 * population white-to-white proxy and the pupil an explicit optical size
 * convention on the fitted neutral sphere; these are not measurements of
 * each subject's cornea or guarantees after identity deformation.
 *
 *
 * @evidence contracts/common.md#principled-implementation Neutral geometry supplies fitted globe/axis while declared population proxy and painting convention supply angular limbus/pupil.
 * @evidence contracts/common.md#clear-and-simple-design locateHumanFaceIrisDisc owns geometry qualification and raster/pigment consumers use the same polar chart.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record does not measure personal cornea, texture boundary or post-morph absolute iris diameter.
 * @evidence contracts/common.md#meaningful-documentation Fields state metre basis frame, radian directions and estimated painted-edge convention.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceIrisDisc is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceIrisDisc declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceIrisDisc itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
 *
 * @author Samchon
 */
export interface IHumanFaceIrisDisc {
  /** Least-squares sclera sphere centre, metres in the neutral basis frame. */
  centre: [number, number, number];

  /** Least-squares sclera sphere radius, metres. */
  radius: number;

  /** Estimated unit optical axis, from protrusion above the fitted sphere. */
  axis: [number, number, number];

  /** Unit azimuth reference perpendicular to `axis`. */
  reference: [number, number, number];

  /** Limbal half-angle from the axis, radians. */
  limbus: number;

  /** Pupillary half-angle from the axis, radians. */
  pupil: number;

  /**
   * Estimated painted-iris half-angle in radians, from the declared
   * population iris-to-globe ratio. The producer does not measure a texture
   * boundary; repainting uses this shared painting convention.
   */
  painted: number;
}
