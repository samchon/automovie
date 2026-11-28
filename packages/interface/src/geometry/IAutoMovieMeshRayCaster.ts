import type { IAutoMovieMeshRayHit } from "./IAutoMovieMeshRayHit";
import type { IAutoMovieMeshRayQueryOptions } from "./IAutoMovieMeshRayQueryOptions";

/**
 * Synchronous ray queries over one owned resident-mesh snapshot, returned by
 * `createMeshRayCaster`.
 *
 * Supply finite three-component origin and nonzero direction in the mesh-local
 * frame. Travel is in metres along the normalized direction. The interval
 * includes both endpoints and requires a finite nonnegative minimum, defaulting
 * to zero, and a maximum at least as large. Positive infinity makes the maximum
 * unbounded. Exclusions address original triangle ordinals. A null answer
 * indicates no unexcluded intersection in that interval. Invalid vectors,
 * travel bounds and triangle ordinals throw before traversal. Unrepresentable
 * intersection arithmetic also throws.
 *
 * The caster tests both windings and includes triangle edges. A determinant
 * within 1e-18 of zero counts as parallel. Queries are synchronous and reuse
 * one traversal stack.
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
