/**
 * One basis surface after skinning: flat XYZ positions and unit normals.
 *
 * @evidence contracts/common.md#principled-implementation Flat XYZ positions and matching unit normals represent the evaluated surface in metres.
 * @evidence contracts/common.md#clear-and-simple-design The result separates posed buffers from the immutable basis topology.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The arrays are evaluation output rather than an embedded catalogue body.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies skinning output, position units and normal normalization.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The posed surface buffers declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The posed surface buffers schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The posed surface buffers type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyPosedSurface {
  /** Posed positions, metres. */
  positions: number[];

  /** Posed unit normals. */
  normals: number[];
}
