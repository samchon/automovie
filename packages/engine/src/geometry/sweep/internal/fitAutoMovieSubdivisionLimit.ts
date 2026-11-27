import type {
  IAutoMovieFitSubdivisionLimit,
  IAutoMovieSubdivisionStencil,
} from "@automovie/interface";

import { solveAutoMovieSubdivisionLimit } from "./solveAutoMovieSubdivisionLimit";
import { stencilAutoMovieSubdivisionLimit } from "./stencilAutoMovieSubdivisionLimit";

/*
 * Solve control positions of a quad cage whose Catmull-Clark limit surface
 * passes through given targets, one per vertex.
 *
 * The limit point of a cage vertex is a fixed linear combination of the vertex
 * and its one-ring. An interior vertex of valence `n` goes to `(n^2 P + 4 sum
 * E
 *
 * - Sum D) / (n (n + 5))`, its edge neighbours `E`and the opposite corners`D`of
 *   its quads (Halstead, Kass and DeRose 1993, SIGGRAPH, "Efficient, fair
 *   interpolation using Catmull-Clark surfaces"); a boundary vertex, whose
 *   boundary is an infinitely sharp crease, goes to`(A + 4 P + B) / 6`along its
 *   two boundary neighbours, the cubic B-spline
 *   limit`subdivideAutoMovieSurface`gives boundaries. Interpolation is the
 *   linear system`L P = T`. It is solved by Jacobi iteration `P <- P + (T - L
 *   P)`from`P = T`, which converges when every eigenvalue of `L` lies between 0
 *   and 2; on a regular grid they lie between 1/9 and 1, and each stencil is a
 *   convex combination dominated by its own vertex. It stops when the largest
 *   residual falls below 1e-10 of the targets' extent or after 2,000 sweeps,
 *   and returns the residual it reached, so a caller can refuse a fit that did
 *   not converge.
 *
 * Pinned vertices keep their target as their control position and are not
 * solved, which is how a cage meets a fixed junction ring exactly: their limit
 * points then depend on the cage around them.
 * Parameter props.faces: Quads as four vertex indices, a manifold with consistent
 * winding; only read.
 * Parameter props.targets: Packed target points `[x, y, z, ...]`, one per vertex;
 * only read.
 * Parameter props.pinned: Whether each vertex keeps its target as its control
 * position; omitted, none.
 * Returns: The packed control positions and the largest remaining residual of
 * an unpinned vertex, in the targets' unit.
 * Error when a face is not a quad, an index is out of range, a vertex
 * belongs to no face, or a vertex has other than zero or two boundary edges.
 */
export const fitAutoMovieSubdivisionLimit: (
  props: IAutoMovieFitSubdivisionLimit.IProps,
) => IAutoMovieFitSubdivisionLimit.IResult = (
  props: IAutoMovieFitSubdivisionLimit.IProps,
): IAutoMovieFitSubdivisionLimit.IResult => {
  const count: number = props.targets.length / 3;
  const stencil: IAutoMovieSubdivisionStencil =
    stencilAutoMovieSubdivisionLimit(props.faces, count);
  const free: Uint8Array = Uint8Array.from(
    { length: count },
    (_: unknown, i: number): number => ((props.pinned?.[i] ?? false) ? 0 : 1),
  );
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
