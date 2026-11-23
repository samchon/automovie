import type { IAutoMovieMesh } from "../model/IAutoMovieMesh";
import type { IAutoMovieSoftBounds } from "./IAutoMovieSoftBounds";

/**
 * The derived drawable geometry of one soft-body state.
 *
 * The engine owns this derivation. The viewer projection copies the derived
 * positions, normals and UVs into Float32 attributes rather than solving cloth
 * independently; that conversion does not preserve every binary64 value exactly
 * or certify native appearance.
 */
export interface IAutoMovieSoftBodySurface {
  /** Identity of the domain the surface was derived from. */
  domain: string;

  /** Absolute step the surface was derived at. */
  step: number;

  /**
   * Triangulated panel. One vertex per particle in row-major order, so a vertex
   * index and a particle index are the same number, and two triangles per
   * lattice quad. Normals are area-weighted from the incident triangles and UVs
   * are the normalized lattice coordinates, so a fabric pattern does not swim
   * as the panel folds.
   */
  mesh: IAutoMovieMesh;

  /**
   * World extent of the panel, or `null` when no triangle was emitted at all; a
   * lattice too thin to hold one quad.
   *
   * One nullable box rather than a nullable minimum beside a nullable maximum:
   * the two can only ever be absent together, and a pair that must agree is a
   * pair that can be made to disagree.
   */
  bounds: IAutoMovieSoftBounds | null;
}
