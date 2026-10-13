/**
 * The part of a basis surface a named skin point is admitted against: its
 * flat XYZ positions.
 *
 * @evidence contracts/common.md#principled-implementation A read-only flat XYZ position array supplies the vertex population against which landmark ordinals are checked.
 * @evidence contracts/common.md#clear-and-simple-design The surface admission view exposes no topology or material data that the point check does not need.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This restricted view performs no coordinate reconstruction or person-specific remapping.
 * @evidence contracts/common.md#meaningful-documentation The comment explains its role in point admission and flat XYZ representation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The landmark surface position view has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The landmark surface position view schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The landmark surface position view declaration allocates no runtime state or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkinLandmarkSurface {
  /** Flat XYZ positions of the surface. */
  positions: readonly number[];
}
