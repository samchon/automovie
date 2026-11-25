import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { nclose } from "./nclose";
import { vclose } from "./vclose";

/**
 * Check a box fixture's actual triangle mesh for closed outward topology and
 * volume.
 *
 * @param mesh Actual local-space mesh, indexed or consecutive non-indexed
 *   triangles.
 * @param vertices Its parsed positions, also used by the caller's coordinate
 *   checks.
 * @param corners Eight independently dimensioned local corners in metres. Every
 *   render vertex is matched to these by the caller, allowing attribute
 *   duplicates.
 * @param volume Analytic width times height times depth, in cubic metres.
 * @returns Whether attributes and triangle references are finite and well
 *   formed, every triangle has area, every welded edge has two opposite
 *   incidences and signed volume matches the positive analytic volume within
 *   1e-9 cubic metres. Corner welding uses 1e-10 metres; triangle cross-product
 *   length must exceed 1e-12 square metres. These tolerances serve the
 *   well-conditioned metre boxes in test_archetype_convex_cell, not arbitrary
 *   scale or intersection certification.
 * @evidence contracts/development/common.md#meaningful-documentation Documents actual mesh and parsed-position ownership, independent corner/volume inputs, duplicate render vertices, SI units, numerical tolerances, caller checks and limits of the topology verdict.
 * @evidence contracts/development/implementation.md#principled-implementation Welds triangle vertices to independently enumerated fixture corners, tests nonzero cross-product area, accumulates signed tetrahedron volumes and requires two opposite directed incidences per undirected edge. Finite aligned optional shading attributes are checked without requiring their presence.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admits buffer layout, reads each triangle, validates its geometry, records its edge incidences and finally compares the complete signed volume and all edge records.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Returns false for malformed references, unmatched corners, degenerate triangles, open or inconsistent edges and wrong signed volume; it never repairs geometry or substitutes an enclosing primitive. Its finite-box oracle does not prove absence of arbitrary mesh self-intersections.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(V+T*C) time for V attributes, T triangles and C fixture corners, with C fixed at eight here; O(T) edge records and constant triangle scratch.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the caller's parsed actual positions and shared nclose/vclose predicates; expected corners and volume stay independent of production hull and mass helpers.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources All edge, index and triangle scratch is call-local. No input is mutated or retained and no process or host is started.
 */
export function convexCellClosedBox(
  mesh: IAutoMovieMesh,
  vertices: readonly IAutoMovieVector3[],
  corners: readonly IAutoMovieVector3[],
  volume: number,
): boolean {
  const indices: number[] =
    mesh.indices ??
    vertices.map((_point: IAutoMovieVector3, index: number): number => index);
  const edges: Map<string, { count: number; winding: number }> = new Map();
  let signedVolume: number = 0;
  if (
    mesh.positions.length % 3 !== 0 ||
    indices.length === 0 ||
    indices.length % 3 !== 0 ||
    (mesh.normals !== null && mesh.normals.length !== mesh.positions.length) ||
    (mesh.uvs !== null && mesh.uvs.length !== vertices.length * 2)
  )
    return false;

  // Physical corner identity joins attribute duplicates without inventing vertices.
  for (let index: number = 0; index < indices.length; index += 3) {
    const triangle: IAutoMovieVector3[] = [];
    const welded: number[] = [];
    for (let corner: number = 0; corner < 3; corner++) {
      const vertexIndex: number = indices[index + corner]!;
      const point: IAutoMovieVector3 | undefined = vertices[vertexIndex];
      if (point === undefined) return false;
      triangle.push(point);
      welded.push(
        corners.findIndex((candidate: IAutoMovieVector3): boolean =>
          vclose(point, candidate, 1e-10),
        ),
      );
    }
    if (welded.includes(-1) || new Set(welded).size !== 3) return false;
    const a: IAutoMovieVector3 = triangle[0]!;
    const b: IAutoMovieVector3 = triangle[1]!;
    const c: IAutoMovieVector3 = triangle[2]!;
    const cross: IAutoMovieVector3 = {
      x: (b.y - a.y) * (c.z - a.z) - (b.z - a.z) * (c.y - a.y),
      y: (b.z - a.z) * (c.x - a.x) - (b.x - a.x) * (c.z - a.z),
      z: (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x),
    };
    if (!(Math.hypot(cross.x, cross.y, cross.z) > 1e-12)) return false;

    // An outward triangle contributes its oriented origin tetrahedron, in cubic metres.
    signedVolume +=
      (a.x * (b.y * c.z - b.z * c.y) +
        a.y * (b.z * c.x - b.x * c.z) +
        a.z * (b.x * c.y - b.y * c.x)) /
      6;
    for (let edge: number = 0; edge < 3; edge++) {
      const from: number = welded[edge]!;
      const to: number = welded[(edge + 1) % 3]!;
      const key: string = `${Math.min(from, to)}:${Math.max(from, to)}`;
      const incidence: { count: number; winding: number } = edges.get(key) ?? {
        count: 0,
        winding: 0,
      };
      incidence.count++;
      incidence.winding += from < to ? 1 : -1;
      edges.set(key, incidence);
    }
  }
  return (
    nclose(signedVolume, volume, 1e-9) &&
    [...edges.values()].every(
      (edge: { count: number; winding: number }): boolean =>
        edge.count === 2 && edge.winding === 0,
    )
  );
}
