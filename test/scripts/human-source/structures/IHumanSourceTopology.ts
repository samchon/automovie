/**
 * The pinned subdivided MPFB skin in the shared frame (metres, Y up, Z
 * forward), fan-triangulated from each polygon's first loop corner as both
 * published bases were. `cornerUv` is two values per triangle corner with V
 * flipped to the published convention (`1 - v`).
 *
 * @author Samchon
 */
export interface IHumanSourceTopology {
  offset: number;
  vertexCount: number;
  positions: Float64Array;
  triangles: Int32Array;
  cornerUv: Float64Array;
}
