import type {
  IAutoMovieMesh,
  IAutoMovieMeshCrossing,
  IAutoMovieMeshCrossingOptions,
} from "@automovie/interface";

import { AutoMovieMeshCrossingGeometry } from "./mesh-crossing/internal/AutoMovieMeshCrossingGeometry";
import type { IAutoMovieMeshCrossingSnapshot } from "./mesh-crossing/internal/IAutoMovieMeshCrossingSnapshot";
import type { IAutoMovieMeshCrossingTriangle } from "./mesh-crossing/internal/IAutoMovieMeshCrossingTriangle";
import { measureMeshCrossings } from "./mesh-crossing/internal/measureMeshCrossings";

/**
 * Query strict triangle crossings against an immutable target mesh snapshot.
 *
 * Both meshes use the same metre frame. A strict crossing requires a triangle
 * edge passing through the interior of the other triangle or a strict coplanar
 * overlap. Touching at a corner or edge supplies no witness by itself. The
 * determinant and normal cutoff is 1e-15 and the coplanar plane-distance
 * threshold is 1e-9 m. The results describe surface intersections, with no
 * penetration depth, containment or swept-surface guarantee.
 */
export class AutoMovieEngineMeshCrossingQuery {
  /**
   * Copy the target mesh's positions and source indices and build its search
   * hierarchy once for repeated queries. Empty surfaces are accepted.
   *
   * @param second Target mesh in the shared metre frame.
   * @returns An immutable snapshot independent of later target buffer edits.
   * @throws Error when positions are nonfinite or triangle buffers malformed.
   */
  public static prepare(
    second: IAutoMovieMesh,
  ): AutoMovieEngineMeshCrossingQuery {
    return new AutoMovieEngineMeshCrossingQuery(
      AutoMovieMeshCrossingGeometry.prepare(second),
    );
  }

  /**
   * Measure a single pair of meshes by preparing the target and querying it.
   *
   * @param first Mesh whose triangles are reported.
   * @param second Target mesh in the same metre frame.
   * @param options Pair population, contact tolerance and point classifier.
   * @returns Crossings in the order described by the instance `measure` method.
   * @throws Error for malformed mesh buffers or out-of-range tolerance.
   */
  public static measure(
    first: IAutoMovieMesh,
    second: IAutoMovieMesh,
    options?: IAutoMovieMeshCrossingOptions,
  ): IAutoMovieMeshCrossing[] {
    return AutoMovieEngineMeshCrossingQuery.prepare(second).measure(
      first,
      options,
    );
  }

  /**
   * Report crossed subject triangles by source ordinal. By default each
   * triangle reports one witness, preferring a transverse crossing over a
   * coplanar overlap. Set `allPairs` to return every witness. Target candidates
   * are ordered by the first mean-extent grid cell the triangles share, in
   * X/Y/Z order, then by the source target triangle ordinal.
   *
   * @param first Current subject mesh, read without modifying its buffers.
   * @param options Pair population, contact tolerance and point classifier.
   * @returns A new crossing array, empty when no witnesses are found.
   * @throws Error for malformed subject buffers or out-of-range tolerance.
   */
  public measure(
    first: IAutoMovieMesh,
    options?: IAutoMovieMeshCrossingOptions,
  ): IAutoMovieMeshCrossing[] {
    return measureMeshCrossings(
      this.#snapshot.hierarchy,
      this.#cell,
      first,
      options,
      false,
    );
  }

  /**
   * Stop at the first strict crossing witness. The contact tolerance, point
   * classifier and input admission follow `measure`. The `allPairs` setting
   * does not affect whether a crossing exists.
   *
   * @param first Subject mesh in the shared metre frame.
   * @param options Contact tolerance and transverse point classifier.
   * @returns Whether any strict crossing exists.
   * @throws Error for malformed subject buffers or out-of-range tolerance.
   */
  public crosses(
    first: IAutoMovieMesh,
    options?: IAutoMovieMeshCrossingOptions,
  ): boolean {
    return (
      measureMeshCrossings(
        this.#snapshot.hierarchy,
        this.#cell,
        first,
        options,
        true,
      ).length > 0
    );
  }

  /**
   * Refit the target hierarchy to new positions with the original index layout.
   * The copied layout retains triangle ordinals, including triangles whose
   * areas become zero or nonzero after refitting. The previous snapshot is
   * still usable. Build a new query when changing the index layout.
   *
   * @param positions Finite XYZ coordinates in the shared metre frame, with the
   *   same scalar count as the original target.
   * @returns A separate snapshot with updated triangle bounds and cell size.
   * @throws Error for missing or nonfinite coordinates or a scalar count that
   *   differs from the original.
   */
  public withPositions(
    positions: readonly number[],
  ): AutoMovieEngineMeshCrossingQuery {
    return new AutoMovieEngineMeshCrossingQuery(
      AutoMovieMeshCrossingGeometry.withPositions(this.#snapshot, positions),
    );
  }

  /** Fixed target topology, current positions and hierarchy. */
  readonly #snapshot: IAutoMovieMeshCrossingSnapshot;

  /** Grid step for deterministic candidate ordering in current coordinates. */
  readonly #cell: number;

  /** Retain the prepared state and derive its candidate ordering grid step. */
  private constructor(snapshot: IAutoMovieMeshCrossingSnapshot) {
    this.#snapshot = snapshot;
    const triangles: readonly IAutoMovieMeshCrossingTriangle[] =
      snapshot.triangles;
    const span: number =
      triangles.length === 0
        ? 0
        : triangles.reduce(
            (total: number, triangle: IAutoMovieMeshCrossingTriangle): number =>
              total +
              Math.max(
                triangle.high[0]! - triangle.low[0]!,
                triangle.high[1]! - triangle.low[1]!,
                triangle.high[2]! - triangle.low[2]!,
              ),
            0,
          ) / triangles.length;
    this.#cell = span > 0 ? span : 1;
  }
}
