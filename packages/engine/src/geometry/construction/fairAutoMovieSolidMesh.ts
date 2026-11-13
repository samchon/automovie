import type { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";

/**
 * Fair a drawn mesh over small discs about given vertices: the discrete thin-plate fill of a hole, the triangles within each disc moved so
 * that the bi-Laplacian of their positions vanishes, with the two rings of vertices outside the disc held where they are.
 *
 * Where a construction leaves a corner that no single surface owns, as at a split's fork, where the host's end and two bands meet, every
 * band turns sharply beside the corner and the skin shows a notch or a crease there. The orthodox remedy in the branching-surface
 * literature trims a small neighbourhood of each fork from the meeting surfaces and fills the hole with a patch G1 to its rim (Gabrielides,
 * Ginnis and Kaklis 2007). On the realized mesh that patch is the minimizer of the discrete thin-plate energy `sum_k |U x_k|^2` over the
 * disc's vertices `x`: `U` the umbrella operator, `U x_k = sum_j (x_j - x_k)` over the neighbours `j` of `k` (Kobbelt, Campagna, Vorsatz
 * and Seidel 1998, "Interactive multi-resolution modeling on arbitrary meshes"), its rows taken at the disc's vertices and the first ring
 * outside it. Its stationary point is `U^2 x = 0` on the disc, the fairing fill of Botsch and Kobbelt 2004 ("An intuitive framework for
 * real-time freeform modeling"), whose solution meets the fixed first ring with the tangent planes the second ring gives it, so the fill
 * is G1 to the skin it leaves. The umbrella's weights are all one, so the system is linear and its weights cannot change sign. The
 * cotangent Laplacian (Pinkall and Polthier 1993), which keeps a planar patch where it is, was tried first: a split's bands are meshed in
 * graded rows and fans, and round f1's forks their obtuse and folded triangles gave negative weights that turned the fill's own triangles
 * over (edges folding by 90 degrees or more round the toes rose from 70 to 106 to 170, as the negative weights were clamped at zero or
 * kept); the umbrella also slides each vertex toward its neighbours' mean, which evens those fans out, and folded fewer (51).
 *
 * The mesh's coincident vertices are read as one (distinct IDs a shared boundary may hold at one position) and moved together, so no seam
 * opens. A disc is the vertices whose shortest path along the mesh's edges from its centre vertex is shorter than its radius, so a disc
 * does not reach across a gap to skin the path does not cross. Overlapping discs are solved as one. The system is solved by conjugate
 * gradients on the displacements, symmetric and positive definite on a disc whose rim holds it; each coordinate is solved apart.
 *
 * A moved vertex keeps its owner and chart coordinates, which then name the surface point it was moved from: the fill belongs to no
 * surface. Topology, indices and every vertex outside the discs are unchanged.
 *
 * @param mesh The drawn mesh, mm; its positions are changed in place.
 * @param discs Each disc's centre as a vertex index of the mesh and its radius along the mesh, mm, positive and finite.
 * @returns How many distinct positions were moved.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The discrete thin-plate energy of the umbrella operator is the standard C1 fairing fill (Kobbelt et al. 1998; Botsch and Kobbelt 2004); two fixed rings give the solve its positional and tangential boundary conditions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass welds and gathers the discs, one assembles the weights and one solves; the caller owns where the discs are.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Moves no vertex outside a disc, changes no index and no chart coordinate; a disc whose centre is not a vertex, or a radius that is not positive and finite, is a thrown premise, never skipped.
 * @evidence contracts/development/common.md#meaningful-documentation States the energy, its weights and why not the cotangent ones, the boundary rings, the welding, the disc's reach, the solver and what a moved vertex keeps.
 * @evidence contracts/development/implementation.md#efficient-algorithms One linear scan of the positions and triangles keeps only triangles near a disc; the disc is gathered by Dijkstra's search over its edges, and conjugate gradients take at most as many matrix-free products as the disc has vertices, each linear in its edges.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The operator is assembled once for all three coordinates and every overlapping disc.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local maps and arrays die with the call; only the mesh's positions are written.
 */
export function fairAutoMovieSolidMesh(
  mesh: AutoMovieSolidMesh.IMesh,
  discs: readonly { vertex: number; radius: number }[],
): number {
  const count: number = mesh.positions.length / 3;
  if (discs.length === 0) return 0;
  for (const disc of discs)
    if (!(Number.isInteger(disc.vertex) && disc.vertex >= 0 && disc.vertex < count) || !(disc.radius > 0 && Number.isFinite(disc.radius)))
      throw new Error(`fairAutoMovieSolidMesh: disc ${JSON.stringify(disc)} has no vertex or no positive finite radius`);
  const at = (v: number): [number, number, number] => [mesh.positions[3 * v]!, mesh.positions[3 * v + 1]!, mesh.positions[3 * v + 2]!];

  // Only vertices within a generous ball of some disc matter: a path shorter than the radius stays inside the ball of that radius, and the
  // two fixed rings lie within two edges more, which the ball's margin of three radii covers on any mesh whose edges near a disc are
  // shorter than a radius.
  const balls: { centre: [number, number, number]; reach: number }[] = discs.map((d: { vertex: number; radius: number }): { centre: [number, number, number]; reach: number } => ({ centre: at(d.vertex), reach: 3 * d.radius }));
  const near = (v: number): boolean => {
    const p: [number, number, number] = at(v);
    return balls.some((b: { centre: [number, number, number]; reach: number }): boolean => Math.hypot(p[0] - b.centre[0], p[1] - b.centre[1], p[2] - b.centre[2]) < b.reach);
  };

  // Coincident vertices read as one: each near vertex's representative is the first near vertex at its exact position.
  const representative: Map<number, number> = new Map();
  const members: Map<number, number[]> = new Map();
  const byPosition: Map<string, number> = new Map();
  for (let v: number = 0; v < count; ++v) {
    if (!near(v)) continue;
    const key: string = at(v).join(",");
    const first: number | undefined = byPosition.get(key);
    const r: number = first ?? v;
    if (first === undefined) {
      byPosition.set(key, v);
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

  // Each disc by Dijkstra's search along the edges from its centre; a linear scan for the nearest open vertex is enough for discs of a few
  // thousand vertices.
  const free: Set<number> = new Set();
  for (const disc of discs) {
    const centre: number = representative.get(disc.vertex)!;
    const distance: Map<number, number> = new Map([[centre, 0]]);
    const open: Set<number> = new Set([centre]);
    while (open.size > 0) {
      let best: number = -1;
      for (const v of open) if (best < 0 || distance.get(v)! < distance.get(best)!) best = v;
      open.delete(best);
      free.add(best);
      for (const w of neighbours.get(best) ?? []) {
        const d: number = distance.get(best)! + length(best, w);
        if (d < disc.radius && d < (distance.get(w) ?? Infinity)) {
          distance.set(w, d);
          open.add(w);
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
  if (second.size === 0 || [...rows].some((v: number): boolean => !neighbours.has(v))) throw new Error("fairAutoMovieSolidMesh: a disc covers its whole component, so no rim holds it");

  // Dense local numbering: the disc's vertices first, then the first ring, then the second.
  const order: number[] = [...free, ...first, ...second];
  const index: Map<number, number> = new Map(order.map((v: number, i: number): [number, number] => [v, i]));
  const [nFree, nRows, nLocal]: number[] = [free.size, rows.size, local.size];

  // The umbrella's rows at the disc and its first ring: each vertex's neighbours along the mesh's edges, all weighted one.
  const start: Int32Array = new Int32Array(nRows + 1);
  const columns: number[] = [];
  for (let i: number = 0; i < nRows; ++i) {
    for (const w of neighbours.get(order[i]!)!) columns.push(index.get(w)!);
    start[i + 1] = columns.length;
  }
  const column: Int32Array = Int32Array.from(columns);

  // The energy's operator on a displacement zero off the disc, `U^T U` at the disc's vertices with `U` read at the rows, and its
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

