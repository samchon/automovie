import { IAutoMovieSubdivisionStencil } from "./IAutoMovieSubdivisionStencil";
import { solveAutoMovieSubdivisionLimit } from "./solveAutoMovieSubdivisionLimit";
import { stencilAutoMovieSubdivisionLimit } from "./stencilAutoMovieSubdivisionLimit";

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
 * @evidence contracts/common.md#clear-and-simple-design `stencilAutoMovieSubdivisionLimit` builds the stencil once from the faces and `solveAutoMovieSubdivisionLimit` runs the plain loop over it, the same two steps a posed rig repeats; the subdivider stays the independent judge of the result.
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
  const stencil: IAutoMovieSubdivisionStencil = stencilAutoMovieSubdivisionLimit(props.faces, count);
  const free: Uint8Array = Uint8Array.from({ length: count }, (_: unknown, i: number): number => (props.pinned?.[i] ?? false ? 0 : 1));
  const positions: number[] = new Array<number>(3 * count).fill(0);
  const residual: number = solveAutoMovieSubdivisionLimit({
    stencil,
    targets: props.targets,
    free,
    positions,
    scratch: new Float64Array(3 * count),
  });
  return { positions, residual };
};
