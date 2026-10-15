/** Most Jacobi sweeps one fit runs. */
const MAX_ITERATIONS: number = 2000;

/** Convergence threshold on the largest residual, relative to the targets' extent. */
const TOLERANCE: number = 1e-10;

/**
 * Solve control positions of a quad cage whose Catmull-Clark limit surface
 * passes through given targets, one per vertex.
 *
 * The limit point of a cage vertex is a fixed linear combination of the
 * vertex and its one-ring. An interior vertex of valence `n` goes to
 * `(n^2 P + 4 sum E + sum D) / (n (n + 5))`, its edge neighbours `E` and the
 * opposite corners `D` of its quads (Halstead, Kass and DeRose 1993, SIGGRAPH,
 * "Efficient, fair interpolation using Catmull-Clark surfaces"); a boundary
 * vertex, whose boundary is an infinitely sharp crease, goes to
 * `(A + 4 P + B) / 6` along its two boundary neighbours, the cubic B-spline
 * limit `subdivideAutoMovieSurface` gives boundaries. Interpolation is the
 * linear system `L P = T`. It is solved by Jacobi iteration
 * `P <- P + (T - L P)` from `P = T`, which converges when every eigenvalue
 * of `L` lies between 0 and 2; on a regular grid they lie between 1/9 and 1,
 * and each stencil is a convex combination dominated by its own vertex. It
 * stops when the largest residual falls below 1e-10 of the targets' extent or
 * after 2,000 sweeps, and returns the residual it reached, so a caller can
 * refuse a fit that did not converge.
 *
 * Pinned vertices keep their target as their control position and are not
 * solved, which is how a cage meets a fixed junction ring exactly: their limit
 * points then depend on the cage around them.
 *
 * @param props.faces Quads as four vertex indices, a manifold with consistent winding; only read.
 * @param props.targets Packed target points `[x, y, z, ...]`, one per vertex; only read.
 * @param props.pinned Whether each vertex keeps its target as its control position; omitted, none.
 * @returns The packed control positions and the largest remaining residual of an unpinned vertex, in the targets' unit.
 * @throws Error when a face is not a quad, an index is out of range, a vertex belongs to no face, or a vertex has other than zero or two boundary edges.
 *
 * @evidence contracts/common.md#principled-implementation Interpolating subdivision by inverting the published limit stencils, as Halstead, Kass and DeRose solve for control points whose limit surface interpolates a mesh; Jacobi iteration converges when the stencil matrix's eigenvalues lie in (0, 2), which holds on regular grids (1/9 to 1), and the residual is returned so a cage where it does not hold is detected rather than trusted. Limitation: semi-sharp creases are not modelled, so a cage carrying creases needs its own fit.
 * @evidence contracts/common.md#clear-and-simple-design The stencil is built once from the faces and the solve is a plain loop over it; the subdivider stays the independent judge of the result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A cage with non-quads or non-manifold boundaries is refused instead of being fitted with an approximate stencil.
 * @evidence contracts/common.md#meaningful-documentation States both stencils and their sources, the solver, its stopping rule, what pinning means and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices and F quads: stencils in O(F), each sweep O(V + F) over the stencil arrays, at most 2,000 sweeps; a regular grid's slowest mode decays by 8/9 per sweep, so about 200 sweeps reach the tolerance.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call fits one cage; the network sampler calls it once per tier.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the stencil arrays, O(F), and two position buffers, O(V), are released on return except the result, which is transferred.
 */
export const fitAutoMovieSubdivisionLimit: (props: {
  faces: ReadonlyArray<readonly number[]>;
  targets: readonly number[];
  pinned?: readonly boolean[];
}) => { positions: number[]; residual: number } = (props: {
  faces: ReadonlyArray<readonly number[]>;
  targets: readonly number[];
  pinned?: readonly boolean[];
}): { positions: number[]; residual: number } => {
  const count: number = props.targets.length / 3;
  if (!Number.isInteger(count)) throw new Error("fit targets must be packed triples");
  // edge neighbours and quad diagonals of each vertex, and its boundary neighbours
  const edges: Array<Set<number>> = Array.from({ length: count }, (): Set<number> => new Set());
  const diagonals: number[][] = Array.from({ length: count }, (): number[] => []);
  const valence: number[] = new Array<number>(count).fill(0);
  const directed: Map<string, number> = new Map();
  props.faces.forEach((face: readonly number[], f: number): void => {
    if (face.length !== 4) throw new Error(`fit face ${f} is not a quad`);
    for (let k: number = 0; k < 4; ++k) {
      const a: number = face[k]!;
      if (!Number.isInteger(a) || a < 0 || a >= count)
        throw new Error(`fit face ${f} names vertex ${a} out of range`);
      const b: number = face[(k + 1) % 4]!;
      const d: number = face[(k + 2) % 4]!;
      edges[a]!.add(b);
      edges[b]!.add(a);
      diagonals[a]!.push(d);
      ++valence[a]!;
      directed.set(`${a},${b}`, (directed.get(`${a},${b}`) ?? 0) + 1);
    }
  });
  const boundary: number[][] = Array.from({ length: count }, (): number[] => []);
  for (const key of directed.keys()) {
    const [a, b] = key.split(",").map(Number) as [number, number];
    if (!directed.has(`${b},${a}`)) {
      boundary[a]!.push(b);
      boundary[b]!.push(a);
    }
  }
  const stencils: Array<{ indices: number[]; weights: number[] }> = [];
  for (let i: number = 0; i < count; ++i) {
    if (valence[i] === 0) throw new Error(`fit vertex ${i} belongs to no face`);
    const b: number[] = boundary[i]!;
    if (b.length === 2) stencils.push({ indices: [b[0]!, i, b[1]!], weights: [1 / 6, 4 / 6, 1 / 6] });
    else if (b.length === 0) {
      const n: number = valence[i]!;
      const scale: number = 1 / (n * (n + 5));
      const indices: number[] = [i];
      const weights: number[] = [n * n * scale];
      for (const e of edges[i]!) {
        indices.push(e);
        weights.push(4 * scale);
      }
      for (const d of diagonals[i]!) {
        indices.push(d);
        weights.push(scale);
      }
      stencils.push({ indices, weights });
    } else throw new Error(`fit vertex ${i} has ${b.length} boundary edges`);
  }
  const targets: readonly number[] = props.targets;
  let extent: number = 0;
  for (let axis: number = 0; axis < 3; ++axis) {
    let low: number = Infinity;
    let high: number = -Infinity;
    for (let i: number = 0; i < count; ++i) {
      low = Math.min(low, targets[3 * i + axis]!);
      high = Math.max(high, targets[3 * i + axis]!);
    }
    extent = Math.max(extent, high - low);
  }
  const free: boolean[] = Array.from({ length: count }, (_: unknown, i: number): boolean => !(props.pinned?.[i] ?? false));
  let positions: number[] = [...targets];
  let next: number[] = [...targets];
  let residual: number = Infinity;
  for (let iteration: number = 0; iteration < MAX_ITERATIONS; ++iteration) {
    residual = 0;
    for (let i: number = 0; i < count; ++i) {
      if (!free[i]) continue;
      const s: { indices: number[]; weights: number[] } = stencils[i]!;
      let x: number = 0;
      let y: number = 0;
      let z: number = 0;
      for (let k: number = 0; k < s.indices.length; ++k) {
        const j: number = s.indices[k]!;
        const w: number = s.weights[k]!;
        x += w * positions[3 * j]!;
        y += w * positions[3 * j + 1]!;
        z += w * positions[3 * j + 2]!;
      }
      const dx: number = targets[3 * i]! - x;
      const dy: number = targets[3 * i + 1]! - y;
      const dz: number = targets[3 * i + 2]! - z;
      residual = Math.max(residual, Math.hypot(dx, dy, dz));
      next[3 * i] = positions[3 * i]! + dx;
      next[3 * i + 1] = positions[3 * i + 1]! + dy;
      next[3 * i + 2] = positions[3 * i + 2]! + dz;
    }
    if (residual <= TOLERANCE * Math.max(extent, Number.MIN_VALUE)) break;
    [positions, next] = [next, positions];
  }
  return { positions, residual: residual === Infinity ? 0 : residual };
};
