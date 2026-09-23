import type { IAutoMovieMesh } from "@automovie/interface";

import { triangleIndicesOf } from "./triangleIndicesOf";

/** A nearest geometric feature and its oriented distance in mesh-local metres. */
interface Hit {
  point: number[];
  normal: number[];
  distance2: number;
  triangle: number;
  feature: "face" | "edge" | "vertex";
  boundary: boolean;
}

interface Edge {
  normal: number[];
  count: number;
  balance: number;
}

interface Triangle {
  id: number;
  a: number[];
  ab: number[];
  ac: number[];
  normal: number[];
  aa: number;
  bb: number;
  abac: number;
  determinant: number;
  segments: {
    from: number;
    to: number;
    point: number[];
    direction: number[];
    length2: number;
    edge: Edge;
  }[];
  low: number[];
  high: number[];
}

type Node = {
  low: number[];
  high: number[];
} & ({ triangles: Triangle[] } | { left: Node; right: Node });

const subtract = (a: readonly number[], b: readonly number[]): number[] =>
  a.map((value, axis) => value - b[axis]);
const dot = (a: readonly number[], b: readonly number[]): number =>
  a.reduce((total, value, axis) => total + value * b[axis], 0);
const cross = (a: readonly number[], b: readonly number[]): number[] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (vector: readonly number[]): number[] => {
  const length = Math.hypot(...vector);
  if (!(length > 0) || !Number.isFinite(length))
    throw new Error("Signed mesh features need finite nonzero normals.");
  return vector.map((value) => value / length);
};

/**
 * Compile an owned closed surface for nearest-point and oriented-distance queries.
 * Numerical surface attachments use the same triangles for metric clearance and
 * side classification. A depth envelope cannot distinguish empty space between
 * disconnected solids or behind a concavity; this query uses the nearest feature.
 *
 * Baerentzen and Aanaes, "Signed distance computation using the angle weighted
 * pseudonormal" (2005), establish the sign from face normals, incident edge-normal
 * sums and angle-weighted vertex normals. The nearest face projection or closed
 * edge segment supplies distance. The bounding-box hierarchy only prunes by a
 * metric lower bound. No radial origin, anatomy label or individual identity is
 * involved. Positive values lie on the oriented exterior side.
 *
 * Exact coordinate welding joins UV-split copies without rounding or moving them.
 * Admission checks finite arithmetic, nondegenerate triangles, paired opposite
 * edges and connected vertex links. The caller still owns an embedded surface
 * without self-intersections and outward orientation, including cavity walls.
 * This function does not infer those properties or close an open boundary.
 * Reversing all faces reverses the sign. Changing positions requires recompiling.
 *
 * With `boundary: "open"` the surface may be an oriented sheet: an edge
 * incident to one triangle is admitted and its pseudonormal is that face's
 * normal, which is what the angle-weighted construction yields for a boundary
 * feature. The sign of a sheet is only meaningful within its reach, the
 * distance below which the nearest feature's orientation still tells the two
 * sides apart; a point beyond a sheet's rim or farther than its local feature
 * size reads an arbitrary side, and the caller states the reach that its
 * geometry justifies. A result whose nearest feature is a rim edge or a
 * vertex on the rim reports `boundary: true`, which is the query's own
 * statement that the side it reports is not a side of the sheet's interior;
 * a closed surface never reports it. Multiply incident or inconsistently
 * wound edges still refuse in either mode. The default is the closed contract
 * above.
 * Inputs and returned vectors never expose the compiled snapshot for mutation.
 * Coordinates use metres; near-boundary floating-point values are returned rather
 * than silently classified through a fixed spatial tolerance.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Supplies metric surface attachments from resident geometry without item-specific approximations.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Preserves source geometry while checking the closed oriented topology required by signed feature distances.
 */
export function createAutoMovieSignedMeshQuery(
  mesh: IAutoMovieMesh,
  options?: { boundary?: "closed" | "open" },
): (point: readonly number[]) => {
  point: number[];
  normal: number[];
  distance: number;
  signedDistance: number;
  triangle: number;
  feature: "face" | "edge" | "vertex";
  boundary: boolean;
} {
  const indices = triangleIndicesOf(mesh, "Signed mesh queries");
  if (indices.length === 0 || !mesh.positions.every(Number.isFinite))
    throw new Error("Signed mesh queries need a nonempty finite surface.");
  const positions = mesh.positions.slice();
  const identities = new Map<string, number>();
  const vertices: number[] = [];
  for (let at = 0; at < positions.length; at += 3) {
    const key = positions.slice(at, at + 3).join(",");
    let identity = identities.get(key);
    if (identity === undefined) {
      identity = identities.size;
      identities.set(key, identity);
    }
    vertices.push(identity);
  }
  const vertexNormals = Array.from({ length: identities.size }, () => [
    0, 0, 0,
  ]);
  const links = Array.from(
    { length: identities.size },
    () => new Map<number, Set<number>>(),
  );
  const edges = new Map<string, Edge>();
  const triangles: Triangle[] = [];
  for (let at = 0; at < indices.length; at += 3) {
    const source = indices.slice(at, at + 3);
    const ids = source.map((id) => vertices[id]);
    const points = source.map((id) => positions.slice(3 * id, 3 * id + 3));
    const [a, b, c] = points;
    const ab = subtract(b, a),
      ac = subtract(c, a);
    const normal = unit(cross(ab, ac));
    const aa = dot(ab, ab),
      bb = dot(ac, ac),
      abac = dot(ab, ac);
    const determinant = aa * bb - abac * abac;
    if (!(determinant > 0) || !Number.isFinite(determinant))
      throw new Error(
        "Signed mesh triangle arithmetic must have finite positive rank.",
      );
    const segments: Triangle["segments"] = [];
    for (let corner = 0; corner < 3; corner++) {
      const next = (corner + 1) % 3,
        previous = (corner + 2) % 3;
      const from = ids[corner],
        to = ids[next];
      const u = unit(subtract(points[next], points[corner]));
      const v = unit(subtract(points[previous], points[corner]));
      const angle = Math.atan2(Math.hypot(...cross(u, v)), dot(u, v));
      for (let axis = 0; axis < 3; axis++)
        vertexNormals[from][axis] += normal[axis] * angle;
      for (const [x, y] of [
        [ids[next], ids[previous]],
        [ids[previous], ids[next]],
      ]) {
        let neighbors = links[from].get(x);
        if (neighbors === undefined) {
          neighbors = new Set<number>();
          links[from].set(x, neighbors);
        }
        neighbors.add(y);
      }
      const key = from < to ? `${from}:${to}` : `${to}:${from}`;
      let edge = edges.get(key);
      if (edge === undefined) {
        edge = { normal: [0, 0, 0], count: 0, balance: 0 };
        edges.set(key, edge);
      }
      for (let axis = 0; axis < 3; axis++) edge.normal[axis] += normal[axis];
      edge.count++;
      edge.balance += from < to ? 1 : -1;
      const direction = subtract(points[next], points[corner]);
      segments.push({
        from,
        to,
        point: points[corner],
        direction,
        length2: dot(direction, direction),
        edge,
      });
    }
    triangles.push({
      id: at / 3,
      a,
      ab,
      ac,
      normal,
      aa,
      bb,
      abac,
      determinant,
      segments,
      low: a.map((value, axis) => Math.min(value, b[axis], c[axis])),
      high: a.map((value, axis) => Math.max(value, b[axis], c[axis])),
    });
  }
  const open = options?.boundary === "open";
  for (const edge of edges.values()) {
    if (
      edge.count > 2 ||
      (edge.count === 2 && edge.balance !== 0) ||
      (edge.count === 1 && !open)
    )
      throw new Error(
        open
          ? "Signed sheet queries require singly or oppositely paired edges."
          : "Signed mesh queries require paired oppositely wound edges.",
      );
    unit(edge.normal);
  }
  const rim = new Set<number>();
  for (const [key, edge] of edges.entries())
    if (edge.count === 1)
      for (const vertex of key.split(":")) rim.add(Number(vertex));
  for (const [vertex, link] of links.entries()) {
    if (link.size === 0) continue;
    const visited = new Set<number>(),
      pending = [link.keys().next().value!];
    while (pending.length > 0) {
      const next = pending.pop()!;
      if (visited.has(next)) continue;
      visited.add(next);
      const neighbors = link.get(next)!;
      // Paired opposite edges already establish degree two in this link.
      pending.push(...neighbors);
    }
    if (visited.size !== link.size)
      throw new Error(
        "A signed mesh vertex cannot join disconnected surface fans.",
      );
    unit(vertexNormals[vertex]);
  }
  const root = buildTree(triangles);
  return (point) => {
    if (point.length !== 3 || !point.every(Number.isFinite))
      throw new Error("Signed mesh queries require finite XYZ coordinates.");
    const extent2 = point.reduce(
      (total, value, axis) =>
        total +
        Math.max(
          Math.abs(value - root.low[axis]),
          Math.abs(value - root.high[axis]),
        ) **
          2,
      0,
    );
    if (!Number.isFinite(extent2))
      throw new Error("Signed mesh query arithmetic must remain finite.");
    let best: Hit | undefined;
    const visit = (node: Node): void => {
      if (best !== undefined && bound(node, point) > best.distance2) return;
      if ("triangles" in node) {
        for (const triangle of node.triangles) {
          const hit = closest(point, triangle, vertexNormals, rim);
          if (
            best === undefined ||
            hit.distance2 < best.distance2 ||
            (hit.distance2 === best.distance2 && hit.triangle < best.triangle)
          )
            best = hit;
        }
      } else if (bound(node.left, point) <= bound(node.right, point)) {
        visit(node.left);
        visit(node.right);
      } else {
        visit(node.right);
        visit(node.left);
      }
    };
    visit(root);
    // A nonempty finite admitted tree always supplies a nearest feature.
    const hit = best!,
      distance = Math.sqrt(hit.distance2);
    return {
      point: hit.point.slice(),
      normal: unit(hit.normal),
      distance,
      signedDistance:
        Math.sign(dot(subtract(point, hit.point), hit.normal)) * distance,
      triangle: hit.triangle,
      feature: hit.feature,
      boundary: hit.boundary,
    };
  };
}

/** Bounding boxes are lower bounds, so traversal order cannot select a farther feature. */
const bound = (node: Node, point: readonly number[]): number =>
  point.reduce(
    (total, value, axis) =>
      total + Math.max(0, node.low[axis] - value, value - node.high[axis]) ** 2,
    0,
  );

const buildTree = (triangles: Triangle[]): Node => {
  const low = [Infinity, Infinity, Infinity],
    high = [-Infinity, -Infinity, -Infinity];
  for (const triangle of triangles)
    for (let axis = 0; axis < 3; axis++) {
      low[axis] = Math.min(low[axis], triangle.low[axis]);
      high[axis] = Math.max(high[axis], triangle.high[axis]);
    }
  if (triangles.length <= 12) return { low, high, triangles };
  const sizes = subtract(high, low),
    axis = sizes.indexOf(Math.max(...sizes));
  triangles.sort(
    (a, b) =>
      (a.low[axis] + a.high[axis]) / 2 - (b.low[axis] + b.high[axis]) / 2,
  );
  const middle = Math.floor(triangles.length / 2);
  return {
    low,
    high,
    left: buildTree(triangles.slice(0, middle)),
    right: buildTree(triangles.slice(middle)),
  };
};

/** Projection onto the face interior, otherwise onto its three closed segments. */
const closest = (
  point: readonly number[],
  triangle: Triangle,
  vertexNormals: number[][],
  rim: ReadonlySet<number>,
): Hit => {
  const t = triangle,
    planeDistance = dot(subtract(point, t.a), t.normal);
  const projected = point.map(
    (value, axis) => value - planeDistance * t.normal[axis],
  );
  const v = subtract(projected, t.a),
    dab = dot(v, t.ab),
    dac = dot(v, t.ac);
  const u = (dab * t.bb - dac * t.abac) / t.determinant;
  const w = (dac * t.aa - dab * t.abac) / t.determinant;
  if (u > 0 && w > 0 && u + w < 1)
    return {
      point: projected,
      normal: t.normal,
      distance2: planeDistance ** 2,
      triangle: t.id,
      feature: "face",
      boundary: false,
    };
  let best: Hit | undefined;
  for (const segment of t.segments) {
    const ratio = Math.max(
      0,
      Math.min(
        1,
        dot(subtract(point, segment.point), segment.direction) /
          segment.length2,
      ),
    );
    const p = segment.point.map(
      (value, axis) => value + ratio * segment.direction[axis],
    );
    const delta = subtract(point, p),
      distance2 = dot(delta, delta);
    if (best === undefined || distance2 < best.distance2) {
      const vertex =
        ratio === 0 ? segment.from : ratio === 1 ? segment.to : undefined;
      best = {
        point: p,
        distance2,
        triangle: t.id,
        normal:
          vertex === undefined ? segment.edge.normal : vertexNormals[vertex],
        feature: vertex === undefined ? "edge" : "vertex",
        boundary:
          vertex === undefined ? segment.edge.count === 1 : rim.has(vertex),
      };
    }
  }
  return best!;
};
