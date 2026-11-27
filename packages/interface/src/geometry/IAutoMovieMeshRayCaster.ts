import type { IAutoMovieMeshRayHit } from "./IAutoMovieMeshRayHit";
import type { IAutoMovieMeshRayQueryOptions } from "./IAutoMovieMeshRayQueryOptions";

/**
 * Synchronous ray queries over one owned resident-mesh snapshot, returned by
 * `createMeshRayCaster`.
 *
 * Every query takes an XYZ `origin` and `direction` in the mesh-local metre
 * frame, a `maximum` travel and an optional `minimum` travel (default zero),
 * and accepts a hit whose travel lies in the inclusive interval [minimum,
 * maximum]. Positive infinity is an unbounded maximum. The direction is
 * normalized first, so travel is metres along the ray. A query throws on a
 * non-finite origin, a zero or non-finite direction, `minimum > maximum`, an
 * exclusion outside the original triangle ordinals, and arithmetic a triangle
 * or box cannot represent. A null answer means no unexcluded triangle lies in
 * the interval, never that the origin is inside a volume.
 *
 * Triangle winding does not matter, an edge belongs to both its triangles, and
 * a ray within the 1e-18 determinant threshold of a triangle's plane passes it.
 * The three queries share one traversal stack, which is safe because each runs
 * to completion without calling back into the caller.
 */
export interface IAutoMovieMeshRayCaster {
  /**
   * Travel to the nearest unexcluded triangle, in metres along the normalized
   * ray, or null when none lies in [minimum, maximum]. The value is the raw
   * computed travel, so a hit at the origin can be negative zero.
   */
  nearest: (
    origin: readonly number[],
    direction: readonly number[],
    maximum: number,
    minimum?: number,
    options?: IAutoMovieMeshRayQueryOptions,
  ) => number | null;

  /**
   * The nearest unexcluded hit with its original triangle ordinal, or null when
   * none lies in [minimum, maximum]. Its travel equals `nearest`'s for the same
   * arguments, and equal travel selects the lowest ordinal. The record is newly
   * allocated and owned by the caller.
   */
  nearestHit: (
    origin: readonly number[],
    direction: readonly number[],
    maximum: number,
    minimum?: number,
    options?: IAutoMovieMeshRayQueryOptions,
  ) => IAutoMovieMeshRayHit | null;

  /**
   * Whether any unexcluded triangle lies in [minimum, maximum]. It returns at
   * the first admitted hit in traversal order, which need not be the nearest.
   */
  blocked: (
    origin: readonly number[],
    direction: readonly number[],
    maximum: number,
    minimum?: number,
    options?: IAutoMovieMeshRayQueryOptions,
  ) => boolean;
}
