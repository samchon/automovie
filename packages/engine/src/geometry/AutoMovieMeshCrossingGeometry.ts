import type {
  IAutoMovieMesh,
  IAutoMovieMeshCrossingGeometry,
} from "@automovie/interface";

import { buildAutoMovieMeshQueryHierarchy } from "./buildAutoMovieMeshQueryHierarchy";
import { refitAutoMovieMeshQueryHierarchy } from "./refitAutoMovieMeshQueryHierarchy";
import { triangleIndicesOf } from "./triangleIndicesOf";

/**
 * Internal geometry ownership for immutable crossing snapshots and refits. The
 * public crossing factory owns queries; this namespace admits complete buffers
 * and retains a copied index layout across independent world snapshots.
 */
export namespace AutoMovieMeshCrossingGeometry {
  /** Admit and index one current subject without retaining its buffers. */
  export function index(
    mesh: IAutoMovieMesh,
  ): IAutoMovieMeshCrossingGeometry.ITriangle[] {
    return read(
      mesh.positions,
      triangleIndicesOf(mesh, "Mesh crossings (complete triangle buffers)"),
    );
  }

  /** Snapshot a complete resident layout and build its initial median hierarchy. */
  export function prepare(
    mesh: IAutoMovieMesh,
  ): IAutoMovieMeshCrossingGeometry.ISnapshot {
    const indices: readonly number[] = Object.freeze(
      triangleIndicesOf(
        mesh,
        "Mesh crossings (complete triangle buffers)",
      ).slice(),
    );
    const triangles: IAutoMovieMeshCrossingGeometry.ITriangle[] = read(
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
          : buildAutoMovieMeshQueryHierarchy.partition([...triangles]),
    };
  }

  /**
   * Snapshot new common-frame coordinates against the fixed source index
   * layout. A wrong scalar count or any nonfinite/hole coordinate refuses
   * before a new snapshot is returned; source and earlier snapshots remain
   * usable.
   */
  export function withPositions(
    source: IAutoMovieMeshCrossingGeometry.ISnapshot,
    positions: readonly number[],
  ): IAutoMovieMeshCrossingGeometry.ISnapshot {
    if (positions.length !== source.positionCount)
      throw new Error(
        "Mesh crossing refit needs the original XYZ position cardinality.",
      );
    const triangles: IAutoMovieMeshCrossingGeometry.ITriangle[] = read(
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
          : refitAutoMovieMeshQueryHierarchy(
              source.hierarchy,
              (
                triangle: IAutoMovieMeshCrossingGeometry.ITriangle,
              ): IAutoMovieMeshCrossingGeometry.ITriangle =>
                triangles[triangle.ordinal]!,
            ),
    };
  }
}

/** Snapshot referenced vertices, then derive every original triangle and box. */
function read(
  positions: readonly number[],
  indices: readonly number[],
): IAutoMovieMeshCrossingGeometry.ITriangle[] {
  for (let scalar: number = 0; scalar < positions.length; scalar++)
    if (!Number.isFinite(positions[scalar]))
      throw new Error("Mesh crossings need finite complete triangle buffers.");
  const used: Uint8Array = new Uint8Array(positions.length / 3);
  for (const index of indices) used[index] = 1;
  const vertices: number[][] = new Array<number[]>(used.length);
  for (let index: number = 0; index < used.length; index++) {
    if (used[index] === 0) continue;
    const start: number = index * 3;
    vertices[index] = [
      positions[start]!,
      positions[start + 1]!,
      positions[start + 2]!,
    ];
  }
  const triangles: IAutoMovieMeshCrossingGeometry.ITriangle[] = [];
  for (let t: number = 0; t < indices.length; t += 3) {
    const a: number[] = vertices[indices[t]!]!;
    const b: number[] = vertices[indices[t + 1]!]!;
    const c: number[] = vertices[indices[t + 2]!]!;
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
