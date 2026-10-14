/**
 * UV-bound normal relief on one body surface; the appearance owner retains texture admission and anatomical qualification.
 *
 * @evidence contracts/common.md#principled-implementation A material identity binds one linear tangent-space normal image over UV0.
 * @evidence contracts/common.md#clear-and-simple-design The relief record carries only the texture binding consumed by appearance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The appearance owner retains texture admission and anatomical qualification; this schema claims neither.
 * @evidence contracts/common.md#meaningful-documentation Members identify the existing material, PNG data representation and UV set.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The surface normal relief binding has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The surface normal relief binding schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The surface normal relief binding declaration allocates no runtime state or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySurfaceRelief {
  /** Existing material whose regions receive this relief. */
  material: string;

  /** Linear tangent-space normal PNG data URI, bound over UV0. */
  texture: string;
}
