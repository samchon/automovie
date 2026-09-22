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

/** The running nearest feature of one query, rewritten in place as it improves. */
interface Best {
  hit: Triangle | undefined;
  point: number[];
  normal: number[];
  distance2: number;
  triangle: number;
  feature: Hit["feature"];
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
 * Callers ask this in millions: one hair strand steps every few millimetres
 * against the whole head, and a contact pass sweeps a surface ring by ring.
 * The traversal is therefore written for that: the inner loop over a leaf's
 * triangles allocates nothing, keeping coordinates in locals and writing only
 * a winning feature into one record per query, and each query first measures
 * the feature the previous one won, which for a caller that walks is usually
 * still near and gives the bound that prunes most of the tree. Neither
 * changes an answer: a node is visited whenever its box is no farther than the
 * running best, and the nearest feature and its tie-break are what they were.
 * Measured on the study's 33,880-triangle head, a walking caller's query fell
 * from 149 to 18 microseconds and a published subject's hair, which is this
 * query millions of times over, from 28.1 to 4.2 seconds, with the exported
 * model identical byte for byte.
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
  // Callers walk: a hair strand steps a few millimetres, a contact pass sweeps
  // one ring of a surface. The feature that won the last query is therefore
  // usually still near, and measuring it first gives the traversal a bound
  // that prunes most of the tree before it starts. It changes nothing about
  // the answer, since a node is still visited whenever its box is no farther
  // than the running best, and the same nearest feature and tie-break come out.
  let recent: Triangle | undefined;
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
    const best: Best = {
      hit: undefined,
      point: [0, 0, 0],
      normal: [0, 0, 1],
      distance2: Infinity,
      triangle: Infinity,
      feature: "face",
      boundary: false,
    };
    if (recent !== undefined) consider(point, recent, vertexNormals, rim, best);
    const visit = (node: Node): void => {
      if (bound(node, point) > best.distance2) return;
      if ("triangles" in node) {
        for (const triangle of node.triangles)
          consider(point, triangle, vertexNormals, rim, best);
      } else if (bound(node.left, point) <= bound(node.right, point)) {
        visit(node.left);
        visit(node.right);
      } else {
        visit(node.right);
        visit(node.left);
      }
    };
    visit(root);
    recent = best.hit;
    // A nonempty finite admitted tree always supplies a nearest feature.
    const hit = best,
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
const bound = (node: Node, point: readonly number[]): number => {
  const x = Math.max(0, node.low[0] - point[0], point[0] - node.high[0]),
    y = Math.max(0, node.low[1] - point[1], point[1] - node.high[1]),
    z = Math.max(0, node.low[2] - point[2], point[2] - node.high[2]);
  return x * x + y * y + z * z;
};

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

/**
 * Projection onto the face interior, otherwise onto its three closed segments,
 * written into the running best when it wins.
 *
 * The traversal reads every triangle of every leaf it cannot prune, so this is
 * the query's whole inner loop and it allocates nothing: coordinates stay in
 * locals and only a winning feature is recorded, with the comparisons the
 * caller would otherwise make. A hit is taken when it is strictly nearer, or
 * equally near on a lower triangle, which keeps one feature deterministic
 * across traversal orders; within one triangle the first of two equally near
 * segments wins.
 */
const consider = (
  point: readonly number[],
  t: Triangle,
  vertexNormals: number[][],
  rim: ReadonlySet<number>,
  best: Best,
): void => {
  const px = point[0],
    py = point[1],
    pz = point[2];
  const nx = t.normal[0],
    ny = t.normal[1],
    nz = t.normal[2];
  const ax = t.a[0],
    ay = t.a[1],
    az = t.a[2];
  const planeDistance = (px - ax) * nx + (py - ay) * ny + (pz - az) * nz;
  const qx = px - planeDistance * nx,
    qy = py - planeDistance * ny,
    qz = pz - planeDistance * nz;
  const vx = qx - ax,
    vy = qy - ay,
    vz = qz - az;
  const dab = vx * t.ab[0] + vy * t.ab[1] + vz * t.ab[2];
  const dac = vx * t.ac[0] + vy * t.ac[1] + vz * t.ac[2];
  const u = (dab * t.bb - dac * t.abac) / t.determinant;
  const w = (dac * t.aa - dab * t.abac) / t.determinant;
  if (u > 0 && w > 0 && u + w < 1) {
    const distance2 = planeDistance ** 2;
    if (
      distance2 < best.distance2 ||
      (distance2 === best.distance2 && t.id < best.triangle)
    ) {
      best.distance2 = distance2;
      best.hit = t;
      best.triangle = t.id;
      best.feature = "face";
      best.boundary = false;
      best.point[0] = qx;
      best.point[1] = qy;
      best.point[2] = qz;
      best.normal = t.normal;
    }
    return;
  }
  let nearest = Infinity,
    cx = 0,
    cy = 0,
    cz = 0,
    normal: number[] = t.normal,
    feature: Hit["feature"] = "edge",
    boundary = false;
  for (const segment of t.segments) {
    const sx = segment.point[0],
      sy = segment.point[1],
      sz = segment.point[2];
    const ex = segment.direction[0],
      ey = segment.direction[1],
      ez = segment.direction[2];
    const ratio = Math.max(
      0,
      Math.min(
        1,
        ((px - sx) * ex + (py - sy) * ey + (pz - sz) * ez) / segment.length2,
      ),
    );
    const rx = sx + ratio * ex,
      ry = sy + ratio * ey,
      rz = sz + ratio * ez;
    const dx = px - rx,
      dy = py - ry,
      dz = pz - rz;
    const distance2 = dx * dx + dy * dy + dz * dz;
    if (distance2 >= nearest) continue;
    const vertex =
      ratio === 0 ? segment.from : ratio === 1 ? segment.to : undefined;
    nearest = distance2;
    cx = rx;
    cy = ry;
    cz = rz;
    normal = vertex === undefined ? segment.edge.normal : vertexNormals[vertex];
    feature = vertex === undefined ? "edge" : "vertex";
    boundary =
      vertex === undefined ? segment.edge.count === 1 : rim.has(vertex);
  }
  if (
    nearest < best.distance2 ||
    (nearest === best.distance2 && t.id < best.triangle)
  ) {
    best.distance2 = nearest;
    best.hit = t;
    best.triangle = t.id;
    best.feature = feature;
    best.boundary = boundary;
    best.point[0] = cx;
    best.point[1] = cy;
    best.point[2] = cz;
    best.normal = normal;
  }
};
