/**
 * Indexed triangle mesh with per-vertex normals: the render-ready form
 * `tessellate` emits for a primitive shape and `tessellateSurface` for a
 * support surface.
 *
 * Unlike {@link IAutoMovieMesh} it is always indexed, always carries normals,
 * and has no texture coordinates or skinning. Positions are metres in the
 * producer's frame: the primitive's local frame centred on the origin, or the
 * surface's world frame. The GLB exporter and the drawing pass read it for a
 * primitive part in place of an authored mesh.
 */
export interface IAutoMovieTessellation {
  /** Packed xyz vertex positions in metres. */
  positions: number[];

  /** Packed unit xyz vertex normals, parallel to {@link positions}. */
  normals: number[];

  /** Triangle corner indices into the packed vertex arrays, three per triangle. */
  indices: number[];
}
