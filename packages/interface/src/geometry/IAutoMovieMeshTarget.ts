import type { IAutoMovieTessellation } from "./IAutoMovieTessellation";

/**
 * The growing attribute buffers a flat-shaded procedural builder appends to
 * before it returns them as an `IAutoMovieMesh` with no skin.
 *
 * `emptyMeshTarget` creates one and `pushFlatTriangle` appends to it; the
 * region extruder and the loft fill it. Positions are metres in the builder's
 * local frame, normals are unit vectors, and `uvs` holds one metric `u, v` pair
 * per vertex, always present because these builders state their atlas.
 */
export interface IAutoMovieMeshTarget extends IAutoMovieTessellation {
  /** Packed metric `u, v` texture coordinates, one pair per vertex. */
  uvs: number[];
}
