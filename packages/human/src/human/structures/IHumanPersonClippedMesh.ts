import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * A posed material-region mesh gathered through one frozen person source cut, with its render vertices' source correspondence. Attribute charts may split one source into several residents, so the source list parallels positions rather than the triangle corners. Both arrays belong to the result.
 *
 * @evidence contracts/common.md#principled-implementation Source correspondence parallels resident vertices rather than triangle corners, allowing attribute charts to split one physical source without losing atlas seams.
 * @evidence contracts/common.md#clear-and-simple-design Mesh and source list form one clipping result so downstream placement receives matching vertex populations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The output preserves actual source cuts and chart residents, without welding UV seams to force a smaller vertex count.
 * @evidence contracts/common.md#meaningful-documentation The comment states owned arrays, posed metre frame and the resident-vertex correspondence needed after clipping.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The result type declares no clipping strategy; the clipper owns corner gathering and resident deduplication.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A clipped result has no equivalence key or memoized producer; frozen-cut reuse belongs to the caller.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The mesh and source arrays are owned by the returned value and become collectible when its consumers release it.
 *
 * @author Samchon
 */
export interface IHumanPersonClippedMesh {
  /** Owned static indexed mesh in the input's posed metre frame. */
  mesh: IAutoMovieMesh;

  /** Frozen cut source identity for each resident mesh vertex. */
  sources: number[];
}
