import {
  measureAutoMovieMeshCrossings,
  validateMeshTopology,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IHumanBodyCappedSurface as CappedSurface } from "./IHumanBodyCappedSurface";
import { humanBodySurfaceBoundary } from "./humanBodySurfaceBoundary";

/**
 * Close each oriented boundary loop with its own centroid fan. Positions are
 * metres in the basis frame; each cap reverses its surface boundary edges so
 * the closed mesh keeps the source winding. A nonplanar loop makes a faceted
 * fan, and admission must check that fan for degeneracy and crossings before
 * its volume is used as mass. The closed mesh supplies the tetrahedron sum
 * and the solid-angle interior probe. Separation uses surface crossings plus
 * containment; coplanar witnesses are clipped to their projected overlap area.
 * At an exact contact, rotated coordinates can produce a floating point
 * straddle or sliver even though no volume is shared. Distances within
 * 1e-12 of the model diagonal and projected areas within 1e-12 of its square count as
 * contact at that numerical boundary. No UV or material seam is introduced.
 *
 * `assertGeometry` runs for every trial body of a mass inversion, so it
 * tests the cap against the source faces near it and against itself, each
 * over a compact mesh of only the triangles and vertices involved: the
 * crossing test scans its whole buffer on admission, and the body's tens of
 * thousands of untouched vertices were most of its cost.
 *
 * @evidence contracts/common.md#principled-implementation Each oriented opening is closed by a reverse-wound centroid fan and its signed tetrahedron sum measures cubic metres; closed-manifold and cap-crossing admission are explicit later assertions, so construction alone does not establish an admissible solid.
 * @evidence contracts/common.md#clear-and-simple-design One resident capped mesh supplies volume, containment and separation; compact cap candidates reduce crossing work while topology and triangle predicates stay with the engine owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Numerical contact uses the documented diagonal-scaled distance and area boundary, not consumer or anatomy exceptions; degenerate, crossed and disconnected surfaces refuse through the explicit assertions.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies metre coordinates, winding, faceted nonplanar caps, numerical contact and deferred admission; the returned contract documents borrowed input lifetime and owned output buffers.
 * @evidence contracts/performance.md#efficient-algorithms Construction copies V vertices and F faces and visits B loop vertices, costing O(V+F+B); assertion, containment and pairwise overlap invoke additional topology and crossing scans documented by the returned operations.
 * @evidence contracts/performance.md#reuse-equivalent-work The capped positions, indices and volume are shared by methods for this exact candidate; a new shape needs a new solid and compact cap meshes are rebuilt when geometry assertions run.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned object owns copied mesh buffers and captures source indices for later admission; its lifetime bounds that O(V+F+B) storage, with no cross-call cache, handles or asynchronous tasks.
 */
export function humanBodyCappedSurface(
  positions: number[],
  indices: number[],
  loops: number[][] = humanBodySurfaceBoundary(indices, true),
): CappedSurface {
  const closedPositions: number[] = positions.slice();
  const closedIndices: number[] = indices.slice();
  const capIndices: number[] = [];
  for (const loop of loops) {
    const centroid: number[] = [0, 0, 0];
    for (const vertex of loop)
      for (let axis: number = 0; axis < 3; axis++)
        centroid[axis] += positions[vertex * 3 + axis] / loop.length;
    const centre: number = closedPositions.length / 3;
    closedPositions.push(...centroid);
    for (let i: number = 0; i < loop.length; i++)
      capIndices.push(loop[(i + 1) % loop.length], loop[i], centre);
  }
  closedIndices.push(...capIndices);
  const mesh: (triangles: number[]) => IAutoMovieMesh = (triangles: number[]): IAutoMovieMesh => ({
    positions: closedPositions,
    indices: triangles,
    normals: null,
    uvs: null,
    skin: null,
  });
  const closed: IAutoMovieMesh = mesh(closedIndices);
  const at: (v: number) => number[] = (v: number): number[] => closedPositions.slice(v * 3, v * 3 + 3);
  let signedVolume: number = 0;
  // The oriented tetrahedron sum V = Σ a · (b × c) / 6. Read each corner
  // from the resident arrays: inverse mass projection repeats this exact
  // sum for every candidate shape, while allocating three corner arrays and
  // a cross-product array per triangle adds no geometry information.
  for (let i: number = 0; i < closedIndices.length; i += 3) {
    const a: number = closedIndices[i] * 3;
    const b: number = closedIndices[i + 1] * 3;
    const c: number = closedIndices[i + 2] * 3;
    signedVolume +=
      (closedPositions[a] *
        (closedPositions[b + 1] * closedPositions[c + 2] -
          closedPositions[b + 2] * closedPositions[c + 1]) +
        closedPositions[a + 1] *
          (closedPositions[b + 2] * closedPositions[c] -
            closedPositions[b] * closedPositions[c + 2]) +
        closedPositions[a + 2] *
          (closedPositions[b] * closedPositions[c + 1] -
            closedPositions[b + 1] * closedPositions[c])) /
      6;
  }
  const volume: number = Math.abs(signedVolume);
  const interiorPoint: () => number[] = (): number[] => {
    const size: number = diagonal(closedPositions);
    const epsilon: number = size * 1e-7;
    for (let i: number = 0; i < closedIndices.length; i += 3) {
      const a: number[] = at(closedIndices[i]);
      const b: number[] = at(closedIndices[i + 1]);
      const c: number[] = at(closedIndices[i + 2]);
      const normal: number[] = cross(subtract(b, a), subtract(c, a));
      const length: number = Math.hypot(...normal);
      if (length === 0) continue;
      const centre: number[] = a.map((value: number, axis: number): number => (value + b[axis] + c[axis]) / 3);
      for (const sign of [-1, 1]) {
        const candidate: number[] = centre.map(
          (value: number, axis: number): number => value + (sign * epsilon * normal[axis]) / length,
        );
        if (inside(closed, candidate)) return candidate;
      }
    }
    throw new Error("A capped body surface needs a measurable interior.");
  };
  return {
    closed,
    volume,
    signedVolume,
    interiorPoint,
    contains: (point: number[]): boolean => inside(closed, point),
    assertGeometry(): void {
      if (!Number.isFinite(volume) || volume === 0)
        throw new Error("A capped body surface needs positive volume.");
      for (let i: number = 0; i < capIndices.length; i += 3) {
        const a: number[] = at(capIndices[i]);
        const b: number[] = at(capIndices[i + 1]);
        const c: number[] = at(capIndices[i + 2]);
        if (Math.hypot(...cross(subtract(b, a), subtract(c, a))) === 0)
          throw new Error("A body boundary cap cannot have zero-area faces.");
      }
      if (capIndices.length === 0) return;
      const capMesh: IAutoMovieMesh = compactMesh(closedPositions, capIndices);
      if (
        measureAutoMovieMeshCrossings(
          capMesh,
          compactMesh(
            closedPositions,
            nearCapTriangles(closedPositions, indices, capIndices),
          ),
        ).length > 0
      )
        throw new Error("A body boundary cap cannot cross its source surface.");
      if (measureAutoMovieMeshCrossings(capMesh, capMesh).length > 0)
        throw new Error("A body boundary cap cannot cross itself.");
    },
    assertValid(): void {
      this.assertGeometry();
      if (!validateMeshTopology({ mesh: closed, expectClosed: true }).success)
        throw new Error("A capped body surface must be a closed manifold.");
      if (!connected(indices))
        throw new Error("A body surface must be connected across its edges.");
      interiorPoint();
    },
    overlaps(other: CappedSurface): boolean {
      if (!boundsOverlap(closedPositions, other.closed.positions)) return false;
      const size: number = Math.max(
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
        const normal: number[] = triangleNormal(closed, crossing.triangle);
        const opposite: number[] = triangleNormal(other.closed, crossing.other);
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
  return a.map((value: number, axis: number): number => value - b[axis]);
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
  const { low, high }: { low: number[]; high: number[] } = bounds(positions);
  return Math.hypot(...low.map((value: number, axis: number): number => high[axis] - value));
}

function boundsOverlap(first: number[], second: number[]): boolean {
  const a: ReturnType<typeof bounds> = bounds(first);
  const b: ReturnType<typeof bounds> = bounds(second);
  for (let axis: number = 0; axis < 3; axis++) {
    if (a.high[axis] <= b.low[axis] || b.high[axis] <= a.low[axis])
      return false;
  }
  return true;
}

function bounds(positions: number[]): { low: number[]; high: number[] } {
  const low: number[] = [Infinity, Infinity, Infinity];
  const high: number[] = [-Infinity, -Infinity, -Infinity];
  for (let i: number = 0; i < positions.length; i += 3)
    for (let axis: number = 0; axis < 3; axis++) {
      low[axis] = Math.min(low[axis], positions[i + axis]);
      high[axis] = Math.max(high[axis], positions[i + axis]);
    }
  return { low, high };
}

function triangleNormal(mesh: IAutoMovieMesh, triangle: number): number[] {
  const [a, b, c]: number[][] = trianglePoints(mesh, triangle);
  return cross(subtract(b, a), subtract(c, a));
}

function trianglePoints(mesh: IAutoMovieMesh, triangle: number): number[][] {
  return mesh
    .indices!.slice(triangle * 3, triangle * 3 + 3)
    .map((vertex: number): number[] => mesh.positions.slice(vertex * 3, vertex * 3 + 3));
}

function transverseInteriorCrossing(
  first: IAutoMovieMesh,
  firstTriangle: number,
  second: IAutoMovieMesh,
  secondTriangle: number,
  margin: number,
): boolean {
  const a: number[][] = trianglePoints(first, firstTriangle);
  const b: number[][] = trianglePoints(second, secondTriangle);
  const straddles: (here: number[][], there: number[][]) => boolean = (here: number[][], there: number[][]): boolean => {
    const normal: number[] = cross(
      subtract(here[1], here[0]),
      subtract(here[2], here[0]),
    );
    const length: number = Math.hypot(...normal);
    const distances: number[] = there.map(
      (point: number[]): number => dot(subtract(point, here[0]), normal) / length,
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
  const a: number[][] = trianglePoints(first, firstTriangle);
  const b: number[][] = trianglePoints(second, secondTriangle);
  const normal: number[] = triangleNormal(first, firstTriangle);
  const drop: number = [0, 1, 2].reduce((best: number, axis: number): number =>
    Math.abs(normal[axis]) > Math.abs(normal[best]) ? axis : best,
  );
  const project: (points: number[][]) => number[][] = (points: number[][]): number[][] =>
    points.map((point: number[]): number[] => point.filter((_: number, axis: number): boolean => axis !== drop));
  const clip: number[][] = project(b);
  let polygon: number[][] = project(a);
  const side: (p: number[], q: number[], r: number[]) => number = (p: number[], q: number[], r: number[]): number =>
    (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const orientation: number = Math.sign(side(clip[0], clip[1], clip[2]));
  for (let i: number = 0; i < 3; i++) {
    const from: number[] = clip[i];
    const to: number[] = clip[(i + 1) % 3];
    const input: number[][] = polygon;
    polygon = [];
    for (let j: number = 0; j < input.length; j++) {
      const current: number[] = input[j];
      const next: number[] = input[(j + 1) % input.length];
      const here: number = side(from, to, current) * orientation;
      const there: number = side(from, to, next) * orientation;
      if (here >= 0) polygon.push(current);
      if ((here < 0 && there > 0) || (here > 0 && there < 0)) {
        const fraction: number = here / (here - there);
        polygon.push(
          current.map((value: number, axis: number): number => value + fraction * (next[axis] - value)),
        );
      }
    }
  }
  let twiceArea: number = 0;
  for (let i: number = 0; i < polygon.length; i++) {
    const p: number[] = polygon[i];
    const q: number[] = polygon[(i + 1) % polygon.length];
    twiceArea += p[0] * q[1] - p[1] * q[0];
  }
  return Math.abs(twiceArea) / 2;
}

/**
 * A mesh of just these triangles over just the vertices they use, in
 * first-use order, with the same coordinates.
 *
 * The crossing test admits a mesh by scanning its whole position buffer, and
 * a cap check hands it a few hundred triangles that index a body of tens of
 * thousands of vertices; every scan of the unused ones is cost with no
 * geometry in it. The predicates read corner coordinates and never vertex
 * numbers, so renumbering leaves every decision as it was.
 */
function compactMesh(positions: number[], triangles: number[]): IAutoMovieMesh {
  const renumbered: Map<number, number> = new Map<number, number>();
  const compact: number[] = [];
  const indices: number[] = triangles.map((vertex: number): number => {
    let index: number | undefined = renumbered.get(vertex);
    if (index === undefined) {
      index = renumbered.size;
      renumbered.set(vertex, index);
      compact.push(...positions.slice(vertex * 3, vertex * 3 + 3));
    }
    return index;
  });
  return { positions: compact, indices, normals: null, uvs: null, skin: null };
}

/**
 * Select the current skin faces whose AABBs can meet a boundary cap.
 *
 * This is a broad phase only; the exact triangle test in `assertGeometry`
 * still decides contact. The direct XYZ scan preserves the same inclusive
 * AABB condition while avoiding temporary vertex and axis arrays for every
 * face in each measured-mass inverse trial.
 */
function nearCapTriangles(
  positions: number[],
  source: number[],
  caps: number[],
): number[] {
  const low: number[] = [Infinity, Infinity, Infinity];
  const high: number[] = [-Infinity, -Infinity, -Infinity];
  for (const vertex of caps)
    for (let axis: number = 0; axis < 3; axis++) {
      const value: number = positions[vertex * 3 + axis];
      low[axis] = Math.min(low[axis], value);
      high[axis] = Math.max(high[axis], value);
    }
  const nearby: number[] = [];
  for (let i: number = 0; i < source.length; i += 3) {
    const a: number = source[i];
    const b: number = source[i + 1];
    const c: number = source[i + 2];
    let overlaps: boolean = true;
    for (let axis: number = 0; axis < 3; axis++) {
      const x: number = positions[a * 3 + axis];
      const y: number = positions[b * 3 + axis];
      const z: number = positions[c * 3 + axis];
      if (Math.max(x, y, z) < low[axis] || Math.min(x, y, z) > high[axis]) {
        overlaps = false;
        break;
      }
    }
    if (overlaps) nearby.push(a, b, c);
  }
  return nearby;
}

function inside(mesh: IAutoMovieMesh, point: number[]): boolean {
  let angle: number = 0;
  const indices: number[] = mesh.indices!;
  for (let i: number = 0; i < indices.length; i += 3) {
    const [a, b, c]: number[][] = indices
      .slice(i, i + 3)
      .map((vertex: number): number[] =>
        subtract(mesh.positions.slice(vertex * 3, vertex * 3 + 3), point),
      );
    const lengths: number[] = [a, b, c].map((vector: number[]): number => Math.hypot(...vector));
    const denominator: number =
      lengths[0] * lengths[1] * lengths[2] +
      dot(a, b) * lengths[2] +
      dot(b, c) * lengths[0] +
      dot(c, a) * lengths[1];
    angle += 2 * Math.atan2(dot(a, cross(b, c)), denominator);
  }
  return Math.abs(angle) > 2 * Math.PI;
}

function connected(indices: number[]): boolean {
  const edges: Map<string, number[]> = new Map<string, number[]>();
  const count: number = indices.length / 3;
  for (let t: number = 0; t < count; t++)
    for (let k: number = 0; k < 3; k++) {
      const a: number = indices[t * 3 + k];
      const b: number = indices[t * 3 + ((k + 1) % 3)];
      const key: string = Math.min(a, b) + "/" + Math.max(a, b);
      const pair: number[] | undefined = edges.get(key);
      if (pair === undefined) edges.set(key, [t]);
      else pair.push(t);
    }
  const neighbours: number[][] = Array.from({ length: count }, (): number[] => []);
  for (const triangles of edges.values())
    if (triangles.length === 2) {
      neighbours[triangles[0]].push(triangles[1]);
      neighbours[triangles[1]].push(triangles[0]);
    }
  const visited: Set<number> = new Set([0]);
  const pending: number[] = [0];
  while (pending.length > 0)
    for (const next of neighbours[pending.pop()!])
      if (!visited.has(next)) {
        visited.add(next);
        pending.push(next);
      }
  return visited.size === count;
}
