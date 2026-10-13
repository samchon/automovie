/**
 * The indexed garment patch on its source skin, before closing and lift.
 *
 * The cut owns these new buffers. Every point has one interpolated normal, and triangle corners address this output order. Shared source edge crossings and exact-zero source corners use one output vertex. An empty retained surface has three empty arrays. Final mesh and Float32 admission remain with the consuming garment and exporter.
 *
 * @evidence contracts/common.md#principled-implementation Owned points/normals and retained source-winding indices preserve shared edge crossings and exact-zero corner identities in one output population.
 * @evidence contracts/common.md#clear-and-simple-design The cut result supplies indexed material geometry for later closing/lift while final mesh/Float32 admission stays consuming-owner responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty retention yields empty arrays rather than invented material faces, and cutting alone cannot certify emitted garment geometry.
 * @evidence contracts/common.md#meaningful-documentation Members give meter output coordinates, aligned interpolated normals and retained triangle correspondence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Cut-result typing computes no source-edge crossing or triangulation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Returned cut buffers expose completed geometry without implementing cross-request shared-edge reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Result arrays have consumer-owned lifetime; this schema acquires no native mesh or task handle.
 * @author Samchon
 */
export interface IHumanBodyUnderwearSurfaceCutResult {
  /** Cut skin points, XYZ metres per output vertex, ready for the lift. */
  points: number[];

  /** Interpolated normal triples in the same output vertex order. */
  normals: number[];

  /** Retained triangles with the source winding, over the cut points. */
  indices: number[];
}
