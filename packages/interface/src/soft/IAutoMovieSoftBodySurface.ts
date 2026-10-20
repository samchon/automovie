import { IAutoMovieMesh } from "../model/IAutoMovieMesh";
import { IAutoMovieSoftBounds } from "./IAutoMovieSoftBounds";

/**
 * The derived drawable geometry of one soft-body state.
 *
 * The engine owns this derivation. The viewer projection copies the derived positions, normals and UVs into Float32 attributes rather than solving cloth independently; that conversion does not preserve every binary64 value exactly or certify native appearance.
 *
 * @evidence contracts/common.md#principled-implementation softBodySurfaceGeometry emits two triangles per lattice quad, sums unnormalized incident cross products for area-weighted normals and maps UVs from normalized row/column coordinates.
 * @evidence contracts/common.md#clear-and-simple-design The surface references its solved domain and step and keeps vertex indices identical to particle indices; the viewer consumes this engine-derived mesh.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A one-row or one-column cord emits no invented sliver triangles and has null surface bounds; degenerate normal sums use the documented up-vector fallback.
 * @evidence contracts/common.md#meaningful-documentation Fields state triangulation, indexing, stable lattice UVs and bounds of indexed vertices rather than a particle-only cord extent.
 */
export interface IAutoMovieSoftBodySurface {
  /** Identity of the domain the surface was derived from. */
  domain: string;

  /** Absolute step the surface was derived at. */
  step: number;

  /**
   * Triangulated panel. One vertex per particle in row-major order, so a vertex index and a particle index are the same number, and two triangles per lattice quad. Normals are area-weighted from the incident triangles and UVs are the normalized lattice coordinates, so a fabric pattern does not swim as the panel folds.
   */
  mesh: IAutoMovieMesh;

  /**
   * World extent of the panel, or `null` when no triangle was emitted at all; a lattice too thin to hold one quad.
   *
   * One nullable box rather than a nullable minimum beside a nullable maximum: the two can only ever be absent together, and a pair that must agree is a pair that can be made to disagree.
   */
  bounds: IAutoMovieSoftBounds | null;
}
