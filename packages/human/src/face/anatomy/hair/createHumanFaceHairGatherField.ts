import { Vector3, createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Follow the current scalp toward one attached tie rather than steering a hair
 * through the head along the Euclidean chord to it. Growth-domain triangle
 * edges form a connected metric graph. Distances from the three vertices of
 * the tie triangle are propagated by Dijkstra using current edge lengths.
 * Linear distance within each triangle has a tangent gradient, and a nearby
 * curve station reads the triangle selected by the engine's open-sheet query.
 * Thus the direction responds to the deformed scalp, not a copied neutral
 * normal or a personal path. The approximation follows mesh edges and may be
 * coarser than a continuous geodesic; the curve integrator still owns contact,
 * turning limits and rejection when the tie cannot be reached.
 *
 * The input's connected, oriented domain and resident indices are admitted by
 * the basis. A disconnected graph or degenerate gradient arithmetic refuses;
 * input arrays remain caller-owned. The returned closure owns the compiled
 * query and immutable gradient vectors for one evaluated face.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Applies the same surface-directed gathering rule to every numerical face document.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Derives an attraction field from current shared scalp distances without storing a personal guide.
 */
export function createHumanFaceHairGatherField(props: {
  positions: readonly number[];
  indices: readonly number[];
  triangles: readonly number[];
  anchor: { point: IAutoMovieVector3; triangle: number };
}): (point: IAutoMovieVector3) => IAutoMovieVector3 {
  const at = (id: number): IAutoMovieVector3 =>
    Vector3.create(
      props.positions[3 * id],
      props.positions[3 * id + 1],
      props.positions[3 * id + 2],
    );
  // The signed query welds coincident source vertices before checking an open
  // sheet. Use the same exact-coordinate identity for its distance graph;
  // otherwise a UV or material seam would invent a disconnected scalp.
  const identities = new Map<string, number>();
  const welded = new Map<number, number>();
  const canonical = (id: number): number => {
    const cached = welded.get(id);
    if (cached !== undefined) return cached;
    const point = at(id);
    const key = `${point.x},${point.y},${point.z}`;
    const owner = identities.get(key) ?? id;
    identities.set(key, owner);
    welded.set(id, owner);
    return owner;
  };
  const edges = new Map<number, Map<number, number>>();
  const connect = (a: number, b: number): void => {
    a = canonical(a);
    b = canonical(b);
    const adjacent = edges.get(a) ?? new Map<number, number>();
    adjacent.set(b, Vector3.length(Vector3.subtract(at(a), at(b))));
    edges.set(a, adjacent);
  };
  for (const triangle of props.triangles) {
    const ids = props.indices.slice(3 * triangle, 3 * triangle + 3);
    for (let corner = 0; corner < 3; corner++) {
      connect(ids[corner], ids[(corner + 1) % 3]);
      connect(ids[(corner + 1) % 3], ids[corner]);
    }
  }
  const distances = new Map([...edges.keys()].map((id) => [id, Infinity]));
  const tieTriangle = props.triangles.indexOf(props.anchor.triangle);
  if (tieTriangle < 0)
    throw new Error("A hair tie must belong to its shared scalp domain.");
  const tie = props.indices.slice(
    3 * props.anchor.triangle,
    3 * props.anchor.triangle + 3,
  );
  for (const id of tie)
    distances.set(
      canonical(id),
      Vector3.length(Vector3.subtract(at(id), props.anchor.point)),
    );
  const remaining = new Set(edges.keys());
  while (remaining.size > 0) {
    let nearest = -1;
    let shortest = Infinity;
    for (const id of remaining) {
      const distance = distances.get(id)!;
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
      const candidate = shortest + length;
      if (candidate < distances.get(other)!) distances.set(other, candidate);
    }
  }
  const gradients = props.triangles.map((triangle) => {
    const [a, b, c] = props.indices.slice(3 * triangle, 3 * triangle + 3);
    const ab = Vector3.subtract(at(b), at(a));
    const ac = Vector3.subtract(at(c), at(a));
    const aa = Vector3.dot(ab, ab);
    const bb = Vector3.dot(ac, ac);
    const cross = Vector3.dot(ab, ac);
    const determinant = aa * bb - cross * cross;
    if (!(determinant > 0) || !Number.isFinite(determinant))
      throw new Error(
        "Gathered scalp gradients need finite nondegenerate triangles.",
      );
    const riseB = distances.get(canonical(b))! - distances.get(canonical(a))!;
    const riseC = distances.get(canonical(c))! - distances.get(canonical(a))!;
    return Vector3.add(
      Vector3.scale(ab, (riseB * bb - riseC * cross) / determinant),
      Vector3.scale(ac, (riseC * aa - riseB * cross) / determinant),
    );
  });
  const query = createAutoMovieSignedMeshQuery(
    {
      positions: [...props.positions],
      indices: props.triangles.flatMap((triangle) =>
        props.indices.slice(3 * triangle, 3 * triangle + 3),
      ),
      normals: null,
      uvs: null,
      skin: null,
    },
    { boundary: "open" },
  );
  return (point) => {
    const hit = query([point.x, point.y, point.z]);
    const descent = Vector3.scale(gradients[hit.triangle], -1);
    if (hit.triangle !== tieTriangle && Vector3.length(descent) > 0)
      return Vector3.normalize(descent);
    // A piecewise-linear vertex-distance interpolant has its minimum at one
    // vertex of the tie triangle, not at an interior barycentric tie. In that
    // triangle use the exact tangent toward the anchor, or every strand could
    // orbit the nearest vertex and leave without ever entering the tie radius.
    const direct = Vector3.subtract(props.anchor.point, point);
    const normal = Vector3.create(hit.normal[0], hit.normal[1], hit.normal[2]);
    const tangent = Vector3.subtract(
      direct,
      Vector3.scale(normal, Vector3.dot(direct, normal)),
    );
    if (Vector3.length(tangent) > 0) return Vector3.normalize(tangent);
    throw new Error("The scalp gathering direction is undefined at its tie.");
  };
}
