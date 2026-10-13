import type { IAutoMovieMesh } from "@automovie/interface";

import { createMeshEdgeKey } from "../math/createMeshEdgeKey";
import type { IAutoMovieMeshQueryHierarchy } from "./IAutoMovieMeshQueryHierarchy";
import type { IAutoMovieSignedMeshQueryHit } from "./IAutoMovieSignedMeshQueryHit";
import type { IAutoMovieSignedMeshQueryOptions } from "./IAutoMovieSignedMeshQueryOptions";
import { buildAutoMovieMeshQueryHierarchy } from "./buildAutoMovieMeshQueryHierarchy";
import { triangleIndicesOf } from "./triangleIndicesOf";

/**
 * Compile a closed oriented surface, or an open oriented sheet, into a
 * nearest-point and signed-distance query.
 *
 * Unlike a depth envelope, which cannot tell the inside from empty space
 * between solids or behind a concavity, this reads the nearest feature: its
 * face projection or closed edge segment gives the distance, and the side of
 * its pseudonormal, the face normal, the sum of an edge's face normals or the
 * angle-weighted vertex normal (Baerentzen and Aanaes, 2005), gives the sign,
 * positive on the oriented exterior. Coordinates are metres, and a point near
 * the surface gets the computed value, not one forced through a tolerance.
 *
 * The mesh is snapshotted, so changing it later needs a new query. Vertices
 * that share exact coordinates are welded, joining UV-split copies without
 * moving them. Admission throws on a malformed or empty index buffer, a
 * non-finite position, a triangle without positive finite area, an edge used
 * by more than two triangles or by two with the same direction, and a vertex
 * whose incident triangles form more than one fan. A closed surface also
 * requires every edge to be paired. The caller still owns an embedded,
 * non-self-intersecting, outward-oriented surface, cavity walls included,
 * which this neither infers nor repairs; reversing every face reverses the
 * sign.
 *
 * With `boundary: "open"` an oriented sheet is admitted: an edge used by one
 * triangle takes that face's normal as its pseudonormal. A sheet's sign is
 * meaningful only within its reach, the distance below which the nearest
 * feature's orientation still separates the two sides, which the caller states
 * from its own geometry; a result whose nearest feature is a rim edge or rim
 * vertex reports `boundary: true`, meaning its side is not a side of the
 * sheet's interior. A closed surface never reports it.
 *
 * Callers query in very large numbers, such as a hair strand stepping a few
 * millimetres at a time against a head, so the leaf loop allocates nothing and
 * each query first measures the triangle the previous one won, which for a
 * walking caller supplies the bound that prunes most of the tree. Neither
 * changes an answer: only boxes farther than the running best are skipped, and
 * among equally near features the lowest triangle ordinal wins. A query throws
 * on a point that is not three finite coordinates or whose distance to the
 * surface's box overflows.
 *
 * @param mesh Surface to snapshot.
 * @param options Closed (default) or open boundary contract.
 * @returns The query for one XYZ point.
 *
 * @evidence contracts/common.md#principled-implementation The angle-weighted pseudonormal theorem of Baerentzen and Aanaes gives the correct sign at the nearest face, edge or vertex of a closed oriented 2-manifold, so the admission checks exactly its premises (finite nondegenerate triangles, paired oppositely wound edges, single-fan vertex links), and a nearest-first box hierarchy with box distances as lower bounds finds the true nearest feature.
 * @evidence contracts/common.md#clear-and-simple-design Compilation admits and precomputes per-triangle projection terms, edge and vertex pseudonormals and the hierarchy; the query is a nearest-first `visit` over the shared `IAutoMovieMeshQueryHierarchy` with one allocation-free `consider` per triangle.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy label, radial origin or spatial tolerance decides a side; welding uses exact coordinates only, and the warm start from the previous winner changes which features are pruned, never the answer or its tie-break.
 * @evidence contracts/common.md#meaningful-documentation States the method and citation, the sign convention, units, the snapshot and weld, every admission refusal and the caller's remaining obligations, the open-sheet contract and its `boundary` flag, the performance design and why it cannot change answers, and the query's refusals.
 * @evidence contracts/performance.md#efficient-algorithms Compilation is linear in triangles plus the hierarchy build and one link walk per vertex; a query visits nodes nearest-first and skips any node or triangle whose box is farther than the running best, so for a walking caller seeded by its previous winner it reads a few leaves rather than all n triangles, O(n) at worst.
 * @evidence contracts/performance.md#reuse-equivalent-work The welded snapshot, per-triangle terms, pseudonormals and hierarchy are compiled once and reused by every query; the only per-query carry-over is the previous winning triangle, used as a warm start and never as an answer.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains the triangles with their precomputed terms and segments, the vertex pseudonormals, the rim vertex set and the hierarchy, all sized by the mesh at compile time, plus one reference to the last winner; the weld map, the position copy, the vertex identities and the vertex links are released after compilation because no callback captures them, and each query allocates one working record and its returned hit.
 * @author Samchon
 */
export function createAutoMovieSignedMeshQuery(
  mesh: IAutoMovieMesh,
  options?: IAutoMovieSignedMeshQueryOptions,
): (point: readonly number[]) => IAutoMovieSignedMeshQueryHit {
  const indices: number[] = triangleIndicesOf(mesh, "Signed mesh queries");
  if (indices.length === 0 || !mesh.positions.every(Number.isFinite))
    throw new Error("Signed mesh queries need a nonempty finite surface.");
  const positions: number[] = mesh.positions.slice();
  const identities: Map<string, number> = new Map();
  const vertices: number[] = [];
  for (let at: number = 0; at < positions.length; at += 3) {
    const key: string = `${positions[at]},${positions[at + 1]},${positions[at + 2]}`;
    let identity: number | undefined = identities.get(key);
    if (identity === undefined) {
      identity = identities.size;
      identities.set(key, identity);
    }
    vertices.push(identity);
  }
  const vertexNormals: number[][] = Array.from(
    { length: identities.size },
    (): number[] => [0, 0, 0],
  );
  const links: Map<number, Set<number>>[] = Array.from(
    { length: identities.size },
    (): Map<number, Set<number>> => new Map(),
  );
  const edges: Map<number | string, IEdge> = new Map();
  const edgeKey: (from: number, to: number) => number | string =
    createMeshEdgeKey(identities.size);
  const triangles: ITriangle[] = [];
  for (let at: number = 0; at < indices.length; at += 3) {
    // A loop keeps `vertices` and `positions` out of the query's closure.
    const source: number[] = indices.slice(at, at + 3);
    const ids: number[] = [];
    const points: number[][] = [];
    for (const id of source) {
      ids.push(vertices[id]!);
      points.push(positions.slice(3 * id, 3 * id + 3));
    }
    const a: number[] = points[0]!;
    const b: number[] = points[1]!;
    const c: number[] = points[2]!;
    const ab: number[] = subtract(b, a);
    const ac: number[] = subtract(c, a);
    const normal: number[] = unit(cross(ab, ac));
    const aa: number = dot(ab, ab);
    const bb: number = dot(ac, ac);
    const abac: number = dot(ab, ac);
    const determinant: number = aa * bb - abac * abac;
    if (!(determinant > 0) || !Number.isFinite(determinant))
      throw new Error(
        `Signed mesh triangle arithmetic must have finite positive rank: triangle ${at / 3}, vertices ${source.join(",")}, determinant ${determinant}, points ${JSON.stringify(points)}.`,
      );
    const segments: ITriangleSegment[] = [];
    for (let corner: number = 0; corner < 3; corner++) {
      const next: number = (corner + 1) % 3;
      const previous: number = (corner + 2) % 3;
      const from: number = ids[corner]!;
      const to: number = ids[next]!;
      const u: number[] = unit(subtract(points[next]!, points[corner]!));
      const v: number[] = unit(subtract(points[previous]!, points[corner]!));
      const angle: number = Math.atan2(Math.hypot(...cross(u, v)), dot(u, v));
      for (let axis: number = 0; axis < 3; axis++)
        vertexNormals[from]![axis] += normal[axis]! * angle;
      // The vertex link maps each neighbour to those across an incident face.
      const before: number = ids[previous]!;
      const link: Map<number, Set<number>> = links[from]!;
      link.set(to, (link.get(to) ?? new Set<number>()).add(before));
      link.set(before, (link.get(before) ?? new Set<number>()).add(to));
      const key: number | string = edgeKey(
        Math.min(from, to),
        Math.max(from, to),
      );
      let edge: IEdge | undefined = edges.get(key);
      if (edge === undefined) {
        edge = {
          low: Math.min(from, to),
          high: Math.max(from, to),
          normal: [0, 0, 0],
          count: 0,
          balance: 0,
        };
        edges.set(key, edge);
      }
      for (let axis: number = 0; axis < 3; axis++)
        edge.normal[axis] += normal[axis]!;
      edge.count++;
      edge.balance += from < to ? 1 : -1;
      const direction: number[] = subtract(points[next]!, points[corner]!);
      segments.push({
        from,
        to,
        point: points[corner]!,
        direction,
        length2: dot(direction, direction),
        edge,
      });
    }
    const low: number[] = a.map((value: number, axis: number): number =>
      Math.min(value, b[axis]!, c[axis]!),
    );
    const high: number[] = a.map((value: number, axis: number): number =>
      Math.max(value, b[axis]!, c[axis]!),
    );
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
      low,
      high,
      centre: low.map(
        (value: number, axis: number): number => (value + high[axis]!) / 2,
      ),
    });
  }
  const open: boolean = options?.boundary === "open";
  const rim: Set<number> = new Set();
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
    if (edge.count === 1) rim.add(edge.low).add(edge.high);
  }
  links.forEach((link: Map<number, Set<number>>, vertex: number): void => {
    if (link.size === 0) return;
    const visited: Set<number> = new Set();
    const pending: number[] = [link.keys().next().value!];
    while (pending.length > 0) {
      const next: number = pending.pop()!;
      if (visited.has(next)) continue;
      visited.add(next);
      // Paired opposite edges already establish degree two in this link.
      pending.push(...link.get(next)!);
    }
    if (visited.size !== link.size)
      throw new Error(
        "A signed mesh vertex cannot join disconnected surface fans.",
      );
    unit(vertexNormals[vertex]!);
  });
  const root: IAutoMovieMeshQueryHierarchy<ITriangle> =
    buildAutoMovieMeshQueryHierarchy(triangles);
  let recent: ITriangle | undefined;
  return (point: readonly number[]): IAutoMovieSignedMeshQueryHit => {
    if (point.length !== 3 || !point.every(Number.isFinite))
      throw new Error("Signed mesh queries require finite XYZ coordinates.");
    let extent2: number = 0;
    for (let axis: number = 0; axis < 3; axis++)
      extent2 += Math.max(
        Math.abs(point[axis]! - root.low[axis]!),
        Math.abs(point[axis]! - root.high[axis]!),
      ) ** 2;
    if (!Number.isFinite(extent2))
      throw new Error("Signed mesh query arithmetic must remain finite.");
    const best: IBest = {
      hit: undefined,
      point: [0, 0, 0],
      normal: [0, 0, 1],
      distance2: Infinity,
      triangle: Infinity,
      feature: "face",
      boundary: false,
    };
    if (recent !== undefined) consider(point, recent, vertexNormals, rim, best);
    visit(root, bound(root, point), point, vertexNormals, rim, best);
    // A nonempty finite admitted tree always supplies a nearest feature.
    recent = best.hit;
    const distance: number = Math.sqrt(best.distance2);
    return {
      point: best.point.slice(),
      normal: unit(best.normal),
      distance,
      signedDistance:
        Math.sign(dot(subtract(point, best.point), best.normal)) * distance,
      triangle: best.triangle,
      feature: best.feature,
      boundary: best.boundary,
    };
  };
}

/**
 * The running nearest feature of one query, rewritten in place as it improves:
 * the owning triangle and its ordinal (Infinity before any), the nearest point,
 * the feature's unnormalized pseudonormal, the squared distance, which feature
 * it is, and whether it lies on an open sheet's rim.
 */
interface IBest {
  hit: ITriangle | undefined;
  point: number[];
  normal: number[];
  distance2: number;
  triangle: number;
  feature: IAutoMovieSignedMeshQueryHit["feature"];
  boundary: boolean;
}

/**
 * One welded edge: its lower and higher vertex identities, the sum of its
 * incident face normals (its pseudonormal), its incident triangle count, and
 * low-to-high uses minus high-to-low uses, zero when paired oppositely.
 */
interface IEdge {
  low: number;
  high: number;
  normal: number[];
  count: number;
  balance: number;
}

/**
 * One directed triangle edge as a closed segment: welded start and end
 * identities, start point, end minus start, its squared length, and the
 * welded edge it lies on.
 */
interface ITriangleSegment {
  from: number;
  to: number;
  point: number[];
  direction: number[];
  length2: number;
  edge: IEdge;
}

/**
 * One admitted triangle: its original ordinal, first corner `a`, edges `ab`
 * and `ac`, unit winding normal, the Gram terms `aa`, `bb`, `abac` and their
 * positive determinant for barycentric projection, and its three closed edge
 * segments in corner order.
 */
interface ITriangle extends IAutoMovieMeshQueryHierarchy.IEntry {
  id: number;
  a: number[];
  ab: number[];
  ac: number[];
  normal: number[];
  aa: number;
  bb: number;
  abac: number;
  determinant: number;
  segments: ITriangleSegment[];
}

/** Componentwise difference, dot product, cross product and unit vector. */
const subtract = (a: readonly number[], b: readonly number[]): number[] =>
  a.map((value: number, axis: number): number => value - b[axis]!);
const dot = (a: readonly number[], b: readonly number[]): number =>
  a.reduce(
    (total: number, value: number, axis: number): number =>
      total + value * b[axis]!,
    0,
  );
const cross = (a: readonly number[], b: readonly number[]): number[] => [
  a[1]! * b[2]! - a[2]! * b[1]!,
  a[2]! * b[0]! - a[0]! * b[2]!,
  a[0]! * b[1]! - a[1]! * b[0]!,
];
const unit = (vector: readonly number[]): number[] => {
  const length: number = Math.hypot(...vector);
  if (!(length > 0) || !Number.isFinite(length))
    throw new Error("Signed mesh features need finite nonzero normals.");
  return vector.map((value: number): number => value / length);
};

/**
 * Nearest-first traversal of the hierarchy. A node is entered whenever its box
 * is no farther than the running best, and its children's box distances are
 * measured once here and passed down, so the order and pruning match a
 * traversal that re-measured them on entry without the repeated work.
 */
const visit = (
  node: IAutoMovieMeshQueryHierarchy<ITriangle>,
  nodeBound: number,
  point: readonly number[],
  vertexNormals: number[][],
  rim: ReadonlySet<number>,
  best: IBest,
): void => {
  if (nodeBound > best.distance2) return;
  if ("triangles" in node) {
    // A triangle's own box bounds its distance from below exactly as a node's
    // box does, so one that cannot be as near as the running best is skipped
    // by the same rule before its projection.
    for (const triangle of node.triangles)
      if (bound(triangle, point) <= best.distance2)
        consider(point, triangle, vertexNormals, rim, best);
    return;
  }
  const left: number = bound(node.left, point);
  const right: number = bound(node.right, point);
  if (left <= right) {
    visit(node.left, left, point, vertexNormals, rim, best);
    visit(node.right, right, point, vertexNormals, rim, best);
  } else {
    visit(node.right, right, point, vertexNormals, rim, best);
    visit(node.left, left, point, vertexNormals, rim, best);
  }
};

/** Squared distance from a point to a box, a lower bound for what it holds. */
const bound = (
  node: { low: number[]; high: number[] },
  p: readonly number[],
): number => {
  const l: number[] = node.low;
  const h: number[] = node.high;
  const x: number = Math.max(0, l[0]! - p[0]!, p[0]! - h[0]!);
  const y: number = Math.max(0, l[1]! - p[1]!, p[1]! - h[1]!);
  const z: number = Math.max(0, l[2]! - p[2]!, p[2]! - h[2]!);
  return x * x + y * y + z * z;
};

/**
 * Projection onto the face interior, otherwise onto its three closed segments,
 * written into the running best when it wins.
 *
 * This is the query's whole inner loop, so it allocates nothing: coordinates
 * stay in locals and only a winning feature is recorded. A hit is taken when it
 * is strictly nearer, or equally near on a lower triangle, which keeps one
 * feature deterministic across traversal orders; within one triangle the first
 * of two equally near segments wins.
 */
const consider = (
  point: readonly number[],
  t: ITriangle,
  normals: number[][],
  rim: ReadonlySet<number>,
  best: IBest,
): void => {
  const px: number = point[0]!;
  const py: number = point[1]!;
  const pz: number = point[2]!;
  const nx: number = t.normal[0]!;
  const ny: number = t.normal[1]!;
  const nz: number = t.normal[2]!;
  const ax: number = t.a[0]!;
  const ay: number = t.a[1]!;
  const az: number = t.a[2]!;
  const offset: number = (px - ax) * nx + (py - ay) * ny + (pz - az) * nz;
  const qx: number = px - offset * nx;
  const qy: number = py - offset * ny;
  const qz: number = pz - offset * nz;
  const vx: number = qx - ax;
  const vy: number = qy - ay;
  const vz: number = qz - az;
  const dab: number = vx * t.ab[0]! + vy * t.ab[1]! + vz * t.ab[2]!;
  const dac: number = vx * t.ac[0]! + vy * t.ac[1]! + vz * t.ac[2]!;
  const u: number = (dab * t.bb - dac * t.abac) / t.determinant;
  const w: number = (dac * t.aa - dab * t.abac) / t.determinant;
  if (u > 0 && w > 0 && u + w < 1) {
    const distance2: number = offset ** 2;
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
  let nearest: number = Infinity;
  let cx: number = 0;
  let cy: number = 0;
  let cz: number = 0;
  let normal: number[] = t.normal;
  let feature: IAutoMovieSignedMeshQueryHit["feature"] = "edge";
  let boundary: boolean = false;
  for (const segment of t.segments) {
    const sx: number = segment.point[0]!;
    const sy: number = segment.point[1]!;
    const sz: number = segment.point[2]!;
    const ex: number = segment.direction[0]!;
    const ey: number = segment.direction[1]!;
    const ez: number = segment.direction[2]!;
    const ratio: number = Math.max(
      0,
      Math.min(
        1,
        ((px - sx) * ex + (py - sy) * ey + (pz - sz) * ez) / segment.length2,
      ),
    );
    const rx: number = sx + ratio * ex;
    const ry: number = sy + ratio * ey;
    const rz: number = sz + ratio * ez;
    const dx: number = px - rx;
    const dy: number = py - ry;
    const dz: number = pz - rz;
    const distance2: number = dx * dx + dy * dy + dz * dz;
    if (distance2 >= nearest) continue;
    const vertex: number | undefined =
      ratio === 0 ? segment.from : ratio === 1 ? segment.to : undefined;
    nearest = distance2;
    cx = rx;
    cy = ry;
    cz = rz;
    normal = vertex === undefined ? segment.edge.normal : normals[vertex]!;
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
