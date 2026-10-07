import type { IAutoMovieMeshRayHit } from "./IAutoMovieMeshRayHit";
import type { IAutoMovieMeshRayQueryOptions } from "./IAutoMovieMeshRayQueryOptions";

/**
 * Synchronous ray queries over one owned resident-mesh snapshot.
 *
 * Origins and distances use mesh-local metres; nonzero directions are
 * normalized. Travel lies in the inclusive interval [minimum, maximum],
 * with minimum defaulting to zero and positive infinity permitting an
 * unbounded ray. The triangle hierarchy still bounds actual mesh traversal.
 * Query-local exclusions use native triangle ordinals. A null answer means
 * no unexcluded target was found in this domain, never a containment pass.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Gives geometry consumers metric, identified and obstruction queries over the same immutable triangle snapshot.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Preserves original geometry and ordinals while exposing each query's travel interval and topology selection.
 * @author Samchon
 */
export interface IAutoMovieMeshRayCaster {
  /** Nearest unexcluded triangle's metric travel, or no hit in the interval. */
  nearest: (
    origin: readonly number[],
    direction: readonly number[],
    maximum: number,
    minimum?: number,
    options?: IAutoMovieMeshRayQueryOptions,
  ) => number | null;

  /** Owned nearest travel and original triangle identity, or no hit. */
  nearestHit: (
    origin: readonly number[],
    direction: readonly number[],
    maximum: number,
    minimum?: number,
    options?: IAutoMovieMeshRayQueryOptions,
  ) => IAutoMovieMeshRayHit | null;

  /** Whether an unexcluded target obstructs the interval; stops at its first hit. */
  blocked: (
    origin: readonly number[],
    direction: readonly number[],
    maximum: number,
    minimum?: number,
    options?: IAutoMovieMeshRayQueryOptions,
  ) => boolean;
}
