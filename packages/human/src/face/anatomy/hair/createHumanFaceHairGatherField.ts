import {
  type IAutoMovieSignedMeshQueryHit as ImportedIAutoMovieSignedMeshQueryHit,
  Vector3,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairGatherFieldProps } from "./IHumanFaceHairGatherFieldProps";

/**
 * Follow the current scalp toward one attached tie rather than steering a hair through the head along the Euclidean chord to it. Growth-domain triangle edges form a connected metric graph. Distances from the three vertices of the tie triangle are propagated by Dijkstra using current edge lengths. Linear distance within each triangle has a tangent gradient, and a nearby curve station reads the triangle selected by the engine's open-sheet query. Thus the direction responds to the deformed scalp, not a copied neutral normal or a personal path. The approximation follows mesh edges and may be coarser than a continuous geodesic; the curve integrator still owns contact, turning limits and rejection when the tie cannot be reached.
 *
 * The input's connected, oriented domain and resident indices are admitted by the basis. A disconnected graph or degenerate gradient arithmetic refuses; input arrays remain caller-owned. The returned closure owns the compiled query and immutable gradient vectors for one evaluated face, together with the tie triangle and a private copy of its point. Replacing caller buffers or moving the caller anchor does not alter this compiled field.
 *
 * @evidence contracts/common.md#principled-implementation Exact coordinate welding joins the scalp domain graph, whose current metric edge distances produce triangle descent gradients.
 * @evidence contracts/common.md#clear-and-simple-design One compiled open-sheet query selects local gradients, with exact tangent-to-anchor direction inside the tie triangle.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Disconnected domains, degenerate gradients and singular tie directions refuse; edge-graph distance is an approximation to continuous geodesics.
 * @evidence contracts/common.md#meaningful-documentation Input coordinates and lengths are metres and contact/turn admission stays with the integrator.
 * @evidence contracts/performance.md#efficient-algorithms The linear nearest-vertex scan makes Dijkstra O(V squared plus edges); gradient construction follows triangles and query cost follows the compiled mesh.
 * @evidence contracts/performance.md#reuse-equivalent-work Compiled gradients and query snapshots serve subsequent station reads without rebuilding the graph.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure owns cloned query buffers, gradients and anchor point; compilation-only graph maps become collectible after return.
 */
export function createHumanFaceHairGatherField(
  props: IHumanFaceHairGatherFieldProps,
): (point: IAutoMovieVector3) => IAutoMovieVector3 {
  const anchorTriangle: number = props.anchor.triangle;
  const anchorPoint: IAutoMovieVector3 = {
    x: props.anchor.point.x,
    y: props.anchor.point.y,
    z: props.anchor.point.z,
  };
  const at: (id: number) => IAutoMovieVector3 = (
    id: number,
  ): IAutoMovieVector3 =>
    Vector3.create(
      props.positions[3 * id],
      props.positions[3 * id + 1],
      props.positions[3 * id + 2],
    );
  // The signed query welds coincident source vertices before checking an open
  // sheet. Use the same exact-coordinate identity for its distance graph;
  // otherwise a UV or material seam would invent a disconnected scalp.
  const identities: Map<string, number> = new Map<string, number>();
  const welded: Map<number, number> = new Map<number, number>();
  const canonical: (id: number) => number = (id: number): number => {
    const cached: number | undefined = welded.get(id);
    if (cached !== undefined) return cached;
    const point: IAutoMovieVector3 = at(id);
    const key: string = `${point.x},${point.y},${point.z}`;
    const owner: number = identities.get(key) ?? id;
    identities.set(key, owner);
    welded.set(id, owner);
    return owner;
  };
  const edges: Map<number, Map<number, number>> = new Map<
    number,
    Map<number, number>
  >();
  const connect: (a: number, b: number) => void = (
    a: number,
    b: number,
  ): void => {
    a = canonical(a);
    b = canonical(b);
    const adjacent: Map<number, number> =
      edges.get(a) ?? new Map<number, number>();
    adjacent.set(b, Vector3.length(Vector3.subtract(at(a), at(b))));
    edges.set(a, adjacent);
  };
  for (const triangle of props.triangles) {
    const ids: number[] = props.indices.slice(3 * triangle, 3 * triangle + 3);
    for (let corner: number = 0; corner < 3; corner++) {
      connect(ids[corner], ids[(corner + 1) % 3]);
      connect(ids[(corner + 1) % 3], ids[corner]);
    }
  }
  const distances: Map<number, number> = new Map(
    [...edges.keys()].map((id: number): [number, number] => [id, Infinity]),
  );
  const tieTriangle: number = props.triangles.indexOf(anchorTriangle);
  if (tieTriangle < 0)
    throw new Error("A hair tie must belong to its shared scalp domain.");
  const tie: number[] = props.indices.slice(
    3 * anchorTriangle,
    3 * anchorTriangle + 3,
  );
  for (const id of tie)
    distances.set(
      canonical(id),
      Vector3.length(Vector3.subtract(at(id), anchorPoint)),
    );
  const remaining: Set<number> = new Set(edges.keys());
  while (remaining.size > 0) {
    let nearest: number = -1;
    let shortest: number = Infinity;
    for (const id of remaining) {
      const distance: number = distances.get(id)!;
      if (distance < shortest || (distance === shortest && id < nearest)) {
        nearest = id;
        shortest = distance;
      }
    }
    if (nearest < 0 || !Number.isFinite(shortest))
      throw new Error(
        "A gathered scalp domain must connect every root to its tie.",
      );
    remaining.delete(nearest);
    for (const [other, length] of edges.get(nearest)!) {
      const candidate: number = shortest + length;
      if (candidate < distances.get(other)!) distances.set(other, candidate);
    }
  }
  const gradients: IAutoMovieVector3[] = props.triangles.map(
    (triangle: number): IAutoMovieVector3 => {
      const [a, b, c]: number[] = props.indices.slice(
        3 * triangle,
        3 * triangle + 3,
      );
      const ab: IAutoMovieVector3 = Vector3.subtract(at(b), at(a));
      const ac: IAutoMovieVector3 = Vector3.subtract(at(c), at(a));
      const aa: number = Vector3.dot(ab, ab);
      const bb: number = Vector3.dot(ac, ac);
      const cross: number = Vector3.dot(ab, ac);
      const determinant: number = aa * bb - cross * cross;
      if (!(determinant > 0) || !Number.isFinite(determinant))
        throw new Error(
          "Gathered scalp gradients need finite nondegenerate triangles.",
        );
      const riseB: number =
        distances.get(canonical(b))! - distances.get(canonical(a))!;
      const riseC: number =
        distances.get(canonical(c))! - distances.get(canonical(a))!;
      return Vector3.add(
        Vector3.scale(ab, (riseB * bb - riseC * cross) / determinant),
        Vector3.scale(ac, (riseC * aa - riseB * cross) / determinant),
      );
    },
  );
  const query: (
    point: readonly number[],
  ) => ImportedIAutoMovieSignedMeshQueryHit = createAutoMovieSignedMeshQuery(
    {
      positions: [...props.positions],
      indices: props.triangles.flatMap((triangle: number): number[] =>
        props.indices.slice(3 * triangle, 3 * triangle + 3),
      ),
      normals: null,
      uvs: null,
      skin: null,
    },
    { boundary: "open" },
  );
  return (point: IAutoMovieVector3): IAutoMovieVector3 => {
    const hit: ImportedIAutoMovieSignedMeshQueryHit = query([
      point.x,
      point.y,
      point.z,
    ]);
    const descent: IAutoMovieVector3 = Vector3.scale(
      gradients[hit.triangle],
      -1,
    );
    if (hit.triangle !== tieTriangle && Vector3.length(descent) > 0)
      return Vector3.normalize(descent);
    // A piecewise-linear vertex-distance interpolant has its minimum at one
    // vertex of the tie triangle, not at an interior barycentric tie. In that
    // triangle use the exact tangent toward the anchor, or every strand could
    // orbit the nearest vertex and leave without ever entering the tie radius.
    const direct: IAutoMovieVector3 = Vector3.subtract(anchorPoint, point);
    const normal: IAutoMovieVector3 = Vector3.create(
      hit.normal[0],
      hit.normal[1],
      hit.normal[2],
    );
    const tangent: IAutoMovieVector3 = Vector3.subtract(
      direct,
      Vector3.scale(normal, Vector3.dot(direct, normal)),
    );
    if (Vector3.length(tangent) > 0) return Vector3.normalize(tangent);
    throw new Error("The scalp gathering direction is undefined at its tie.");
  };
}
