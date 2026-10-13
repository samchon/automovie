import { ITessellation } from "./ITessellation";

/**
 * The growing attribute buffers a flat-shaded procedural builder appends to
 * before it returns them as an `IAutoMovieMesh` with no skin.
 *
 * `emptyMeshTarget` creates one and `pushFlatTriangle` appends to it; the
 * region extruder and the loft fill it. Positions are metres in the builder's
 * local frame, normals are unit vectors, and `uvs` holds one metric `u, v` pair
 * per vertex, always present because these builders state their atlas.
 *
 * @evidence contracts/common.md#principled-implementation Extends `ITessellation`'s three parallel flat arrays with a parallel UV array, the glTF attribute layout the mesh record itself uses, so the builder spreads the target into its result without reshaping.
 * @evidence contracts/common.md#clear-and-simple-design One named shape for the buffers that `emptyMeshTarget` creates and `pushFlatTriangle` appends to, which each previously declared as its own private copy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts UVs are required rather than nullable, so a builder using this target cannot quietly omit its atlas.
 * @evidence contracts/common.md#meaningful-documentation States its creator, appender and fillers, the unit and frame of each array, and why UVs are always present.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; the append cost is answered on `pushFlatTriangle` and the builders.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each builder call fills a fresh target that becomes its returned mesh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns four number arrays that grow with the emitted vertex and triangle counts and are handed over, not copied, to the returned mesh.
 * @author Samchon
 */
export interface IAutoMovieMeshTarget extends ITessellation {
  /** Packed metric `u, v` texture coordinates, one pair per vertex. */
  uvs: number[];
}
