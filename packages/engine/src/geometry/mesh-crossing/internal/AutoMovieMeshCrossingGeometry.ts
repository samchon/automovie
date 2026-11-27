import type { IAutoMovieMesh } from "@automovie/interface";

import { buildMeshQueryHierarchy } from "../../internal/buildMeshQueryHierarchy";
import { refitMeshQueryHierarchy } from "../../internal/refitMeshQueryHierarchy";
import { triangleIndicesOf } from "../../internal/triangleIndicesOf";
import type { IAutoMovieMeshCrossingSnapshot } from "./IAutoMovieMeshCrossingSnapshot";
import type { IAutoMovieMeshCrossingTriangle } from "./IAutoMovieMeshCrossingTriangle";

/*
 * Internal geometry ownership for immutable crossing snapshots and refits. The
 * public crossing class owns queries; this namespace admits complete buffers
 * and retains a copied index layout across independent world snapshots.
 */
export namespace AutoMovieMeshCrossingGeometry {
  /*
   * Admit and index one current subject without retaining its buffers.
   */
  export function index(
    mesh: IAutoMovieMesh,
  ): IAutoMovieMeshCrossingTriangle[] {
    return read(
      mesh.positions,
      triangleIndicesOf(mesh, "Mesh crossings (complete triangle buffers)"),
    );
  }

  /*
   * Snapshot a complete resident layout and build its initial median hierarchy.
   */
  export function prepare(
    mesh: IAutoMovieMesh,
  ): IAutoMovieMeshCrossingSnapshot {
    const indices: readonly number[] = triangleIndicesOf(
      mesh,
      "Mesh crossings (complete triangle buffers)",
    ).slice();
    const triangles: IAutoMovieMeshCrossingTriangle[] = read(
      mesh.positions,
      indices,
    );
    return {
      positionCount: mesh.positions.length,
      indices,
      triangles,
      hierarchy:
        triangles.length === 0
          ? undefined
          : buildMeshQueryHierarchy([...triangles]),
    };
  }

  /*
   * Snapshot new common-frame coordinates against the fixed source index
   * layout. A wrong scalar count or nonfinite coordinate refuses. Source and
   * earlier snapshots remain usable.
   */
  export function withPositions(
    source: IAutoMovieMeshCrossingSnapshot,
    positions: readonly number[],
  ): IAutoMovieMeshCrossingSnapshot {
    if (positions.length !== source.positionCount)
      throw new Error(
        "Mesh crossing refit needs the original XYZ position cardinality.",
      );
    const triangles: IAutoMovieMeshCrossingTriangle[] = read(
      positions,
      source.indices,
    );
    return {
      positionCount: source.positionCount,
      indices: source.indices,
      triangles,
      hierarchy:
        source.hierarchy === undefined
          ? undefined
          : refitMeshQueryHierarchy(
              source.hierarchy,
              (
                triangle: IAutoMovieMeshCrossingTriangle,
              ): IAutoMovieMeshCrossingTriangle => triangles[triangle.ordinal]!,
            ),
    };
  }
}

/*
 * Admit every coordinate, then copy each addressed triple and its exact box.
 */
function read(
  positions: readonly number[],
  indices: readonly number[],
): IAutoMovieMeshCrossingTriangle[] {
  // Coordinates outside the index run must still belong to a valid mesh.
  for (let i: number = 0; i < positions.length; ++i)
    if (!Number.isFinite(positions[i]))
      throw new Error(
        `Mesh crossing positions need finite XYZ coordinates at scalar ${i}.`,
      );

  const at = (vertex: number): number[] => [
    positions[vertex * 3]!,
    positions[vertex * 3 + 1]!,
    positions[vertex * 3 + 2]!,
  ];
  const triangles: IAutoMovieMeshCrossingTriangle[] = [];
  for (let t: number = 0; t < indices.length; t += 3) {
    const a: number[] = at(indices[t]!);
    const b: number[] = at(indices[t + 1]!);
    const c: number[] = at(indices[t + 2]!);
    const low: number[] = [0, 1, 2].map((axis: number): number =>
      Math.min(a[axis]!, b[axis]!, c[axis]!),
    );
    const high: number[] = [0, 1, 2].map((axis: number): number =>
      Math.max(a[axis]!, b[axis]!, c[axis]!),
    );
    triangles.push({
      ordinal: t / 3,
      corners: [a, b, c],
      low,
      high,

      // Half-sums retain finite partition centres when a represented extent overflows.
      centre: [0, 1, 2].map(
        (axis: number): number => low[axis]! / 2 + high[axis]! / 2,
      ),
    });
  }
  return triangles;
}
