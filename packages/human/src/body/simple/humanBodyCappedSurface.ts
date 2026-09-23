import {
  measureAutoMovieMeshCrossings,
  validateMeshTopology,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import { humanBodySurfaceBoundary } from "./humanBodySurfaceBoundary";

interface CappedSurface {
  closed: IAutoMovieMesh;
  caps: IAutoMovieMesh;
  volume: number;
  signedVolume: number;
  assertValid(): void;
  assertGeometry(): void;
  overlaps(other: CappedSurface): boolean;
  interiorPoint(): number[];
}

/**
 * Close each oriented boundary loop with its own centroid fan. Positions are
 * metres in the basis frame; each cap reverses its surface boundary edges so
 * the closed mesh keeps the source winding. A nonplanar loop makes a faceted
 * fan, and admission must check that fan for degeneracy and crossings before
 * its volume is used as mass. The closed mesh supplies the tetrahedron sum
 * and the solid-angle interior probe. Separation uses surface crossings plus
 * containment; coplanar witnesses are clipped to their actual overlap area.
 * At an exact contact, rotated coordinates can produce a floating point
 * straddle or sliver even though no volume is shared. Distances within
 * 1e-12 of the model diagonal and areas within 1e-12 of its square count as
 * contact at that numerical boundary. No UV or material seam is introduced.
 */
export function humanBodyCappedSurface(
  positions: number[],
  indices: number[],
  loops: number[][] = humanBodySurfaceBoundary(indices, true),
): CappedSurface {
  const closedPositions = positions.slice();
  const closedIndices = indices.slice();
  const capIndices: number[] = [];
  for (const loop of loops) {
    const centroid = [0, 0, 0];
    for (const vertex of loop)
      for (let axis = 0; axis < 3; axis++)
        centroid[axis] += positions[vertex * 3 + axis] / loop.length;
    const centre = closedPositions.length / 3;
    closedPositions.push(...centroid);
    for (let i = 0; i < loop.length; i++)
      capIndices.push(loop[(i + 1) % loop.length], loop[i], centre);
  }
  closedIndices.push(...capIndices);
  const mesh = (triangles: number[]): IAutoMovieMesh => ({
    positions: closedPositions,
    indices: triangles,
    normals: null,
    uvs: null,
    skin: null,
  });
  const closed = mesh(closedIndices);
  const caps = mesh(capIndices);
  const at = (v: number): number[] => closedPositions.slice(v * 3, v * 3 + 3);
  let signedVolume = 0;
  for (let i = 0; i < closedIndices.length; i += 3) {
    const a = at(closedIndices[i]);
    const b = at(closedIndices[i + 1]);
    const c = at(closedIndices[i + 2]);
    signedVolume += dot(a, cross(b, c)) / 6;
  }
  const volume = Math.abs(signedVolume);
  const interiorPoint = (): number[] => {
    const size = diagonal(closedPositions);
    const epsilon = size * 1e-7;
    for (let i = 0; i < closedIndices.length; i += 3) {
      const a = at(closedIndices[i]);
      const b = at(closedIndices[i + 1]);
      const c = at(closedIndices[i + 2]);
      const normal = cross(subtract(b, a), subtract(c, a));
      const length = Math.hypot(...normal);
      if (length === 0) continue;
      const centre = a.map((value, axis) => (value + b[axis] + c[axis]) / 3);
      for (const sign of [-1, 1]) {
        const candidate = centre.map(
          (value, axis) => value + (sign * epsilon * normal[axis]) / length,
        );
        if (inside(closed, candidate)) return candidate;
      }
    }
    throw new Error("A capped body surface needs a measurable interior.");
  };
  return {
    closed,
    caps,
    volume,
    signedVolume,
    interiorPoint,
    assertGeometry(): void {
      if (!Number.isFinite(volume) || volume === 0)
        throw new Error("A capped body surface needs positive volume.");
      for (let i = 0; i < capIndices.length; i += 3) {
        const a = at(capIndices[i]);
        const b = at(capIndices[i + 1]);
        const c = at(capIndices[i + 2]);
        if (Math.hypot(...cross(subtract(b, a), subtract(c, a))) === 0)
          throw new Error("A body boundary cap cannot have zero-area faces.");
      }
      if (
        capIndices.length > 0 &&
        measureAutoMovieMeshCrossings(
          caps,
          mesh(nearCapTriangles(closedPositions, indices, capIndices)),
        ).length > 0
      )
        throw new Error("A body boundary cap cannot cross its source surface.");
      const count = capIndices.length / 3;
      for (let bit = 1; bit < count; bit *= 2) {
        const first: number[] = [];
        const second: number[] = [];
        for (let triangle = 0; triangle < count; triangle++)
          (triangle & bit ? first : second).push(
            ...capIndices.slice(triangle * 3, triangle * 3 + 3),
          );
        if (measureAutoMovieMeshCrossings(mesh(first), mesh(second)).length > 0)
          throw new Error("A body boundary cap cannot cross itself.");
      }
    },
    assertValid(): void {
      this.assertGeometry();
      if (!validateMeshTopology({ mesh: closed, expectClosed: true }).success)
        throw new Error("A capped body surface must be a closed manifold.");
      if (!connected(indices))
        throw new Error("A body surface must be connected across its edges.");
      interiorPoint();
    },
    overlaps(other): boolean {
      if (!boundsOverlap(closedPositions, other.closed.positions)) return false;
      const size = Math.max(
        diagonal(closedPositions),
        diagonal(other.closed.positions),
      );
      for (const crossing of measureAutoMovieMeshCrossings(
        closed,
        other.closed,
      )) {
        if (!crossing.coplanar) {
          if (
            transverseInteriorCrossing(
              closed,
              crossing.triangle,
              other.closed,
              crossing.other,
              size * 1e-12,
            )
          )
            return true;
          continue;
        }
        const normal = triangleNormal(closed, crossing.triangle);
        const opposite = triangleNormal(other.closed, crossing.other);
        if (
          dot(normal, opposite) * signedVolume * other.signedVolume > 0 &&
          coplanarOverlapArea(
            closed,
            crossing.triangle,
            other.closed,
            crossing.other,
          ) >
            1e-12 * size ** 2
        )
          return true;
      }
      return (
        inside(other.closed, interiorPoint()) ||
        inside(closed, other.interiorPoint())
      );
    },
  };
}

function subtract(a: number[], b: number[]): number[] {
  return a.map((value, axis) => value - b[axis]);
}

function dot(a: number[], b: number[]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: number[], b: number[]): number[] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function diagonal(positions: number[]): number {
  const { low, high } = bounds(positions);
  return Math.hypot(...low.map((value, axis) => high[axis] - value));
}

function boundsOverlap(first: number[], second: number[]): boolean {
  const a = bounds(first);
  const b = bounds(second);
  for (let axis = 0; axis < 3; axis++) {
    if (a.high[axis] <= b.low[axis] || b.high[axis] <= a.low[axis])
      return false;
  }
  return true;
}

function bounds(positions: number[]): { low: number[]; high: number[] } {
  const low = [Infinity, Infinity, Infinity];
  const high = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3)
    for (let axis = 0; axis < 3; axis++) {
      low[axis] = Math.min(low[axis], positions[i + axis]);
      high[axis] = Math.max(high[axis], positions[i + axis]);
    }
  return { low, high };
}

function triangleNormal(mesh: IAutoMovieMesh, triangle: number): number[] {
  const [a, b, c] = trianglePoints(mesh, triangle);
  return cross(subtract(b, a), subtract(c, a));
}

function trianglePoints(mesh: IAutoMovieMesh, triangle: number): number[][] {
  return mesh
    .indices!.slice(triangle * 3, triangle * 3 + 3)
    .map((vertex) => mesh.positions.slice(vertex * 3, vertex * 3 + 3));
}

function transverseInteriorCrossing(
  first: IAutoMovieMesh,
  firstTriangle: number,
  second: IAutoMovieMesh,
  secondTriangle: number,
  margin: number,
): boolean {
  const a = trianglePoints(first, firstTriangle);
  const b = trianglePoints(second, secondTriangle);
  const straddles = (here: number[][], there: number[][]): boolean => {
    const normal = cross(
      subtract(here[1], here[0]),
      subtract(here[2], here[0]),
    );
    const length = Math.hypot(...normal);
    const distances = there.map(
      (point) => dot(subtract(point, here[0]), normal) / length,
    );
    return Math.min(...distances) < -margin && Math.max(...distances) > margin;
  };
  return straddles(a, b) && straddles(b, a);
}

function coplanarOverlapArea(
  first: IAutoMovieMesh,
  firstTriangle: number,
  second: IAutoMovieMesh,
  secondTriangle: number,
): number {
  const a = trianglePoints(first, firstTriangle);
  const b = trianglePoints(second, secondTriangle);
  const normal = triangleNormal(first, firstTriangle);
  const drop = [0, 1, 2].reduce((best, axis) =>
    Math.abs(normal[axis]) > Math.abs(normal[best]) ? axis : best,
  );
  const project = (points: number[][]): number[][] =>
    points.map((point) => point.filter((_, axis) => axis !== drop));
  const clip = project(b);
  let polygon = project(a);
  const side = (p: number[], q: number[], r: number[]): number =>
    (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const orientation = Math.sign(side(clip[0], clip[1], clip[2]));
  for (let i = 0; i < 3; i++) {
    const from = clip[i];
    const to = clip[(i + 1) % 3];
    const input = polygon;
    polygon = [];
    for (let j = 0; j < input.length; j++) {
      const current = input[j];
      const next = input[(j + 1) % input.length];
      const here = side(from, to, current) * orientation;
      const there = side(from, to, next) * orientation;
      if (here >= 0) polygon.push(current);
      if ((here < 0 && there > 0) || (here > 0 && there < 0)) {
        const fraction = here / (here - there);
        polygon.push(
          current.map((value, axis) => value + fraction * (next[axis] - value)),
        );
      }
    }
  }
  let twiceArea = 0;
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i];
    const q = polygon[(i + 1) % polygon.length];
    twiceArea += p[0] * q[1] - p[1] * q[0];
  }
  return Math.abs(twiceArea) / 2;
}

function nearCapTriangles(
  positions: number[],
  source: number[],
  caps: number[],
): number[] {
  const low = [Infinity, Infinity, Infinity];
  const high = [-Infinity, -Infinity, -Infinity];
  for (const vertex of caps)
    for (let axis = 0; axis < 3; axis++) {
      const value = positions[vertex * 3 + axis];
      low[axis] = Math.min(low[axis], value);
      high[axis] = Math.max(high[axis], value);
    }
  const nearby: number[] = [];
  for (let i = 0; i < source.length; i += 3) {
    const vertices = source.slice(i, i + 3);
    if (
      [0, 1, 2].every((axis) => {
        const values = vertices.map((vertex) => positions[vertex * 3 + axis]);
        return (
          Math.max(...values) >= low[axis] && Math.min(...values) <= high[axis]
        );
      })
    )
      nearby.push(...vertices);
  }
  return nearby;
}

function inside(mesh: IAutoMovieMesh, point: number[]): boolean {
  let angle = 0;
  const indices = mesh.indices!;
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = indices
      .slice(i, i + 3)
      .map((vertex) =>
        subtract(mesh.positions.slice(vertex * 3, vertex * 3 + 3), point),
      );
    const lengths = [a, b, c].map((vector) => Math.hypot(...vector));
    const denominator =
      lengths[0] * lengths[1] * lengths[2] +
      dot(a, b) * lengths[2] +
      dot(b, c) * lengths[0] +
      dot(c, a) * lengths[1];
    angle += 2 * Math.atan2(dot(a, cross(b, c)), denominator);
  }
  return Math.abs(angle) > 2 * Math.PI;
}

function connected(indices: number[]): boolean {
  const edges = new Map<string, number[]>();
  const count = indices.length / 3;
  for (let t = 0; t < count; t++)
    for (let k = 0; k < 3; k++) {
      const a = indices[t * 3 + k];
      const b = indices[t * 3 + ((k + 1) % 3)];
      const key = Math.min(a, b) + "/" + Math.max(a, b);
      const pair = edges.get(key);
      if (pair === undefined) edges.set(key, [t]);
      else pair.push(t);
    }
  const neighbours = Array.from({ length: count }, () => [] as number[]);
  for (const triangles of edges.values())
    if (triangles.length === 2) {
      neighbours[triangles[0]].push(triangles[1]);
      neighbours[triangles[1]].push(triangles[0]);
    }
  const visited = new Set([0]);
  const pending = [0];
  while (pending.length > 0)
    for (const next of neighbours[pending.pop()!])
      if (!visited.has(next)) {
        visited.add(next);
        pending.push(next);
      }
  return visited.size === count;
}
