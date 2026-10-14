/**
 * One triangle of an eye's textured globe: its three neutral corner positions
 * and the matching three corner texture coordinates.
 *
 *
 * @evidence contracts/common.md#principled-implementation Three matching neutral position/UV corners retain one source eye triangle's affine correspondence.
 * @evidence contracts/common.md#clear-and-simple-design The globe finder produces the record and rasterization owns texel-centre barycentrics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts UV appearance does not independently infer geometry or anatomical ownership.
 * @evidence contracts/common.md#meaningful-documentation The prose specifies matching corner order, metric positions and texture coordinates.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceIrisGlobeTriangle is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceIrisGlobeTriangle declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceIrisGlobeTriangle itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
 *
 * @author Samchon
 */
export interface IHumanFaceIrisGlobeTriangle {
  /** Three neutral corner positions, metres. */
  positions: [number, number, number][];

  /** Three corner texture coordinates, in the same order. */
  uvs: [number, number][];
}
