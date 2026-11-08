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
 *
 * @evidence contracts/development/design.md#principled-representation Three flat parallel arrays in the layout GPU vertex buffers and glTF attributes take, so exporters copy them without reshaping, and every index addresses one xyz triple of both `positions` and `normals`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The smallest mesh record a renderer can draw, kept apart from `IAutoMovieMesh` because primitive and surface tessellation never produce UVs, skins or a missing index buffer, so consumers need no null checks.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Producers emit the shape's own normals rather than leaving them for a consumer to guess, and the drawing pass refuses misaligned arrays instead of truncating them; one gap remains, the GLB exporter also fills this shape from an authored mesh with empty arrays standing for missing normals or indices.
 * @evidence contracts/development/common.md#meaningful-documentation States the producers, how it differs from `IAutoMovieMesh`, the unit and frame per producer, the array alignment, and its consumers.
 */
export interface ITessellation {
  /** Packed xyz vertex positions in metres. */
  positions: number[];

  /** Packed unit xyz vertex normals, parallel to {@link positions}. */
  normals: number[];

  /** Triangle corner indices into the packed vertex arrays, three per triangle. */
  indices: number[];
}
