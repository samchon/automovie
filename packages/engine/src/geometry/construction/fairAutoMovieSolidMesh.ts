import type { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";

/**
 * Fair a drawn mesh over the regions about given vertices: the discrete thin-plate fill of a hole, the triangles within each region moved
 * so that the bi-Laplacian of their positions vanishes, with the two rings of vertices outside the region held where they are.
 *
 * Where a construction leaves a corner that no single surface owns, as at a split's fork, where the host's end and two bands meet, every
 * band turns sharply beside the corner and the skin shows a notch or a crease there; where a part is merged onto its host, the narrow
 * blend between them leaves a notch wherever the trace turns sharply. The orthodox remedy in the branching-surface literature trims a
 * neighbourhood of the corner or the seam from the meeting surfaces and fills the hole with a patch G1 to its rim (Gabrielides, Ginnis and
 * Kaklis 2007). On the realized mesh that patch is the minimizer of the discrete thin-plate energy `sum_k |U x_k|^2` over the region's
 * vertices `x`: `U` the umbrella operator, `U x_k = sum_j (x_j - x_k)` over the neighbours `j` of `k` (Kobbelt, Campagna, Vorsatz and
 * Seidel 1998, "Interactive multi-resolution modeling on arbitrary meshes"), its rows taken at the region's vertices and the first ring
 * outside it. Its stationary point is `U^2 x = 0` on the region, the fairing fill of Botsch and Kobbelt 2004 ("An intuitive framework for
 * real-time freeform modeling"), whose solution meets the fixed first ring with the tangent planes the second ring gives it, so the fill
 * is G1 to the skin it leaves. The umbrella's weights are all one, so the system is linear and its weights cannot change sign. The
 * cotangent Laplacian (Pinkall and Polthier 1993), which keeps a planar patch where it is, was tried first: a split's bands are meshed in
 * graded rows and fans, and round f1's forks their obtuse and folded triangles gave negative weights that turned the fill's own triangles
 * over (edges folding by 90 degrees or more round the toes rose from 70 to 106 to 170, as the negative weights were clamped at zero or
 * kept); the umbrella also slides each vertex toward its neighbours' mean, which evens those fans out, and folded fewer (51).
 *
 * The mesh's coincident vertices are read as one (distinct IDs a shared boundary may hold at one position) and moved together, so no seam
 * opens. A region is the vertices whose shortest path along the mesh's edges from the nearest of its sources is shorter than its radius:
 * one source is a disc about a point, a curve's vertices a band along the curve. A region does not reach across a gap to skin the path
 * does not cross. Overlapping regions are solved as one. The system is solved by conjugate gradients on the displacements, symmetric and
 * positive definite on a region whose rim holds it; each coordinate is solved apart.
 *
 * A moved vertex keeps its owner and chart coordinates, which then name the surface point it was moved from: the fill belongs to no
 * surface. Topology, indices and every vertex outside the regions are unchanged.
 *
 * @param mesh The drawn mesh, mm; its positions are changed in place.
 * @param regions Each region's sources as vertex indices of the mesh, at least one, and its radius along the mesh, mm, positive and finite.
 * @returns How many distinct positions were moved.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The discrete thin-plate energy of the umbrella operator is the standard C1 fairing fill (Kobbelt et al. 1998; Botsch and Kobbelt 2004); two fixed rings give the solve its positional and tangential boundary conditions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass welds and gathers the regions, one assembles the operator and one solves; the caller owns where the regions are.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Moves no vertex outside a region, changes no index and no chart coordinate; a region without sources, a source that is not a vertex, or a radius that is not positive and finite, is a thrown premise, never skipped.
 * @evidence contracts/development/common.md#meaningful-documentation States the energy, its weights and why not the cotangent ones, the boundary rings, the welding, the region's reach from its sources, the solver and what a moved vertex keeps.
 * @evidence contracts/development/implementation.md#efficient-algorithms One linear scan of the positions, through a hash of cells as wide as the largest reach, and one of the triangles keep only what lies near a source; each region is gathered by Dijkstra's search from all its sources with a binary heap, and conjugate gradients take at most as many matrix-free products as the regions have vertices, each linear in their edges.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The operator is assembled once for all three coordinates and every overlapping region.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local maps and arrays die with the call; only the mesh's positions are written.
 */
export function fairAutoMovieSolidMesh(
  mesh: AutoMovieSolidMesh.IMesh,
  regions: readonly { vertices: readonly number[]; radius: number }[],
): number {
  const count: number = mesh.positions.length / 3;
  if (regions.length === 0) return 0;
  for (const region of regions)
    if (region.vertices.length === 0 || region.vertices.some((v: number): boolean => !(Number.isInteger(v) && v >= 0 && v < count)) || !(region.radius > 0 && Number.isFinite(region.radius)))
      throw new Error(`fairAutoMovieSolidMesh: a region of radius ${region.radius} has no sources, a source that is no vertex, or no positive finite radius`);
  const at = (v: number): [number, number, number] => [mesh.positions[3 * v]!, mesh.positions[3 * v + 1]!, mesh.positions[3 * v + 2]!];

  // Only vertices within a generous ball of some source matter: a path shorter than the radius stays inside the ball of that radius, and
  // the two fixed rings lie within two edges more, which the ball's margin of three radii covers on any mesh whose edges near a region
  // are shorter than a radius. The sources are hashed in cells as wide as the largest reach, so each vertex reads 27 cells.
  const cell: number = 3 * Math.max(...regions.map((r: { radius: number }): number => r.radius));
  const key = (p: readonly number[]): string => p.map((x: number): number => Math.floor(x / cell)).join(",");
  const cells: Map<string, { p: [number, number, number]; reach: number }[]> = new Map();
  for (const region of regions)
    for (const v of region.vertices) {
      const p: [number, number, number] = at(v);
      const k: string = key(p);
      if (!cells.has(k)) cells.set(k, []);
      cells.get(k)!.push({ p, reach: 3 * region.radius });
    }
  const near = (v: number): boolean => {
    const p: [number, number, number] = at(v);
    const c: number[] = p.map((x: number): number => Math.floor(x / cell));
    for (let i: number = -1; i <= 1; ++i)
      for (let j: number = -1; j <= 1; ++j)
        for (let k: number = -1; k <= 1; ++k)
          for (const s of cells.get(`${c[0]! + i},${c[1]! + j},${c[2]! + k}`) ?? []) if (Math.hypot(p[0] - s.p[0], p[1] - s.p[1], p[2] - s.p[2]) < s.reach) return true;
    return false;
  };

  // Coincident vertices read as one: each near vertex's representative is the first near vertex at its exact position.
  const representative: Map<number, number> = new Map();
  const members: Map<number, number[]> = new Map();
  const byPosition: Map<string, number> = new Map();
  for (let v: number = 0; v < count; ++v) {
    if (!near(v)) continue;
    const position: string = at(v).join(",");
    const first: number | undefined = byPosition.get(position);
    const r: number = first ?? v;
    if (first === undefined) {
      byPosition.set(position, v);
      members.set(v, []);
    }
    representative.set(v, r);
    members.get(r)!.push(v);
  }

  // Each representative's neighbours along the edges of the triangles whose three vertices are near.
  const neighbours: Map<number, Set<number>> = new Map();
  for (let t: number = 0; t < mesh.indices.length; t += 3) {
    const ids: (number | undefined)[] = [0, 1, 2].map((k: number): number | undefined => representative.get(mesh.indices[t + k]!));
    if (ids.some((id: number | undefined): boolean => id === undefined)) continue;
    const [a, b, c] = ids as [number, number, number];
    if (a === b || b === c || c === a) continue;
    for (const [p, q] of [[a, b], [b, c], [c, a]] as [number, number][]) {
      if (!neighbours.has(p)) neighbours.set(p, new Set());
      if (!neighbours.has(q)) neighbours.set(q, new Set());
      neighbours.get(p)!.add(q);
      neighbours.get(q)!.add(p);
    }
  }
  const length = (p: number, q: number): number => {
    const [x, y]: [number, number, number][] = [at(p), at(q)];
    return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
  };

  // Each region by Dijkstra's search along the edges from all its sources at once, on a binary heap of `[distance, vertex]`.
  const free: Set<number> = new Set();
  for (const region of regions) {
    const distance: Map<number, number> = new Map();
    const heap: [number, number][] = [];
    const push = (d: number, v: number): void => {
      heap.push([d, v]);
      for (let i: number = heap.length - 1; i > 0; ) {
        const parent: number = (i - 1) >> 1;
        if (heap[parent]![0] <= heap[i]![0]) break;
        [heap[parent], heap[i]] = [heap[i]!, heap[parent]!];
        i = parent;
      }
    };
    const pop = (): [number, number] => {
      const top: [number, number] = heap[0]!;
      const last: [number, number] = heap.pop()!;
      if (heap.length > 0) {
        heap[0] = last;
        for (let i: number = 0; ; ) {
          const [l, r]: number[] = [2 * i + 1, 2 * i + 2];
          let least: number = i;
          if (l < heap.length && heap[l]![0] < heap[least]![0]) least = l;
          if (r < heap.length && heap[r]![0] < heap[least]![0]) least = r;
          if (least === i) break;
          [heap[least], heap[i]] = [heap[i]!, heap[least]!];
          i = least;
        }
      }
      return top;
    };
    for (const v of region.vertices) {
      const source: number = representative.get(v)!;
      distance.set(source, 0);
      push(0, source);
    }
    while (heap.length > 0) {
      const [d, v] = pop();
      if (d > distance.get(v)!) continue;
      free.add(v);
      for (const w of neighbours.get(v) ?? []) {
        const next: number = d + length(v, w);
        if (next < region.radius && next < (distance.get(w) ?? Infinity)) {
          distance.set(w, next);
          push(next, w);
        }
      }
    }
  }

  // The two fixed rings: the first holds the fill's position at its rim, the second, with the first, its tangent plane there.
  const ring = (inside: Set<number>): Set<number> => {
    const out: Set<number> = new Set();
    for (const v of inside) for (const w of neighbours.get(v) ?? []) if (!inside.has(w)) out.add(w);
    return out;
  };
  const first: Set<number> = ring(free);
  const rows: Set<number> = new Set([...free, ...first]);
  const second: Set<number> = ring(rows);
  const local: Set<number> = new Set([...rows, ...second]);
  if (second.size === 0 || [...rows].some((v: number): boolean => !neighbours.has(v))) throw new Error("fairAutoMovieSolidMesh: a region covers its whole component, so no rim holds it");

  // Dense local numbering: the regions' vertices first, then the first ring, then the second.
  const order: number[] = [...free, ...first, ...second];
  const index: Map<number, number> = new Map(order.map((v: number, i: number): [number, number] => [v, i]));
  const [nFree, nRows, nLocal]: number[] = [free.size, rows.size, local.size];

  // The umbrella's rows at the regions and their first ring: each vertex's neighbours along the mesh's edges, all weighted one.
  const start: Int32Array = new Int32Array(nRows + 1);
  const columns: number[] = [];
  for (let i: number = 0; i < nRows; ++i) {
    for (const w of neighbours.get(order[i]!)!) columns.push(index.get(w)!);
    start[i + 1] = columns.length;
  }
  const column: Int32Array = Int32Array.from(columns);

  // The energy's operator on a displacement zero off the regions, `U^T U` at their vertices with `U` read at the rows, and its
  // diagonal for a Jacobi preconditioner: the valence squared plus one for every neighbour that is a row.
  const z: Float64Array = new Float64Array(nLocal);
  const umbrella = (x: Float64Array, i: number): number => {
    let sum: number = -(start[i + 1]! - start[i]!) * x[i]!;
    for (let k: number = start[i]!; k < start[i + 1]!; ++k) sum += x[column[k]!]!;
    return sum;
  };
  const apply = (x: Float64Array, out: Float64Array): void => {
    for (let k: number = 0; k < nRows; ++k) z[k] = umbrella(x, k);
    for (let i: number = 0; i < nFree; ++i) out[i] = umbrella(z, i);
  };
  const diagonal: Float64Array = new Float64Array(nFree);
  for (let i: number = 0; i < nFree; ++i) {
    let d: number = (start[i + 1]! - start[i]!) ** 2;
    for (let k: number = start[i]!; k < start[i + 1]!; ++k) if (column[k]! < nRows) d += 1;
    diagonal[i] = d;
  }

  // Preconditioned conjugate gradients per coordinate on the displacement, from none, to a residual a ten-billionth of the first.
  const positions: Float64Array[] = [0, 1, 2].map((axis: number): Float64Array => Float64Array.from(order, (v: number): number => at(v)[axis]!));
  const full: Float64Array = new Float64Array(nLocal);
  const gradient: Float64Array = new Float64Array(nLocal);
  const [r, s, p, q, d]: Float64Array[] = Array.from({ length: 5 }, (): Float64Array => new Float64Array(nFree));
  const dot = (a: Float64Array, b: Float64Array): number => {
    let sum: number = 0;
    for (let i: number = 0; i < nFree; ++i) sum += a[i]! * b[i]!;
    return sum;
  };
  for (const x of positions) {
    apply(x, gradient);
    d.fill(0);
    for (let i: number = 0; i < nFree; ++i) {
      r[i] = -gradient[i]!;
      s[i] = r[i]! / diagonal[i]!;
      p[i] = s[i]!;
    }
    let rs: number = dot(r, s);
    const goal: number = dot(r, r) * 1e-20;
    for (let iteration: number = 0; iteration < Math.max(50, nFree) && dot(r, r) > goal; ++iteration) {
      full.fill(0);
      full.set(p);
      apply(full, q);
      const pq: number = dot(p, q);
      if (!(pq > 0)) break;
      const alpha: number = rs / pq;
      for (let i: number = 0; i < nFree; ++i) {
        d[i] = d[i]! + alpha * p[i]!;
        r[i] = r[i]! - alpha * q[i]!;
        s[i] = r[i]! / diagonal[i]!;
      }
      const next: number = dot(r, s);
      for (let i: number = 0; i < nFree; ++i) p[i] = s[i]! + (next / rs) * p[i]!;
      rs = next;
    }
    for (let i: number = 0; i < nFree; ++i) x[i] = x[i]! + d[i]!;
  }

  // Every coincident member of a moved representative takes its new position.
  for (let i: number = 0; i < nFree; ++i)
    for (const m of members.get(order[i]!)!) for (let axis: number = 0; axis < 3; ++axis) mesh.positions[3 * m + axis] = positions[axis]![i]!;
  return nFree;
}

