/**
 * The indexed garment patch on its source skin, before closing and lift.
 *
 * The cut owns these new buffers. Every point has one interpolated normal,
 * and triangle corners address this output order. Shared source edge
 * crossings and exact-zero source corners use one output vertex. An empty
 * retained surface has three empty arrays. Final mesh and Float32 admission
 * remain with the consuming garment and exporter.
 *
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
