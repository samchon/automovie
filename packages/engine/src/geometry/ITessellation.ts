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
 * @evidence contracts/common.md#principled-implementation Three flat parallel arrays in the layout GPU vertex buffers and glTF attributes take, so exporters copy them without reshaping, and every index addresses one xyz triple of both `positions` and `normals`.
 * @evidence contracts/common.md#clear-and-simple-design The smallest mesh record a renderer can draw, kept apart from `IAutoMovieMesh` because primitive and surface tessellation never produce UVs, skins or a missing index buffer, so consumers need no null checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Producers emit the shape's own normals rather than leaving them for a consumer to guess, and the drawing pass refuses misaligned arrays instead of truncating them; one gap remains, the GLB exporter also fills this shape from an authored mesh with empty arrays standing for missing normals or indices.
 * @evidence contracts/common.md#meaningful-documentation States the producers, how it differs from `IAutoMovieMesh`, the unit and frame per producer, the array alignment, and its consumers.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; tessellation cost is answered on `tessellate` and `tessellateSurface`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built fresh per call; the drawing index memoizes tessellated parts per model part, which is answered there.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns three number arrays sized by the vertex and triangle counts of one shape, released with whoever holds the record.
 * @author Samchon
 */
export interface ITessellation {
  /** Packed xyz vertex positions in metres. */
  positions: number[];

  /** Packed unit xyz vertex normals, parallel to {@link positions}. */
  normals: number[];

  /** Triangle corner indices into the packed vertex arrays, three per triangle. */
  indices: number[];
}
