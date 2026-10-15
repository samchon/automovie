import { IAutoMovieSubdivisionStencil } from "./IAutoMovieSubdivisionStencil";

/** Most Jacobi sweeps one solve runs. */
const MAX_ITERATIONS: number = 2000;

/** Convergence threshold on the largest residual, relative to the targets' extent. */
const TOLERANCE: number = 1e-10;

/**
 * Solve, in place, the control positions whose Catmull-Clark limit points
 * are the targets.
 *
 * The free vertices satisfy `L P = T` for the limit stencils `L`, solved by
 * Jacobi iteration `P <- P + (T - L P)` from `P = T`; held vertices keep their
 * target as their control position. The iteration converges when every
 * eigenvalue of `L` lies between 0 and 2; on a regular grid they lie between
 * 1/9 and 1. It stops when the largest residual of a free vertex falls below
 * 1e-10 of the targets' extent or after 2,000 sweeps, and returns that
 * residual, so a caller can refuse a fit that did not converge.
 *
 * @param props.stencil Limit stencils of the cage; only read.
 * @param props.targets Packed targets `[x, y, z, ...]`; only read.
 * @param props.free 1 for each vertex to solve, 0 for one held at its target; only read.
 * @param props.positions Receives the controls, `3 * count` numbers.
 * @param props.scratch A second buffer of the same length, overwritten.
 * @returns The largest remaining residual of a free vertex, in the targets' unit; 0 when none is free.
 *
 * @evidence contracts/common.md#principled-implementation Interpolating subdivision by inverting the limit stencils, as Halstead, Kass and DeRose solve for controls whose limit surface interpolates a mesh; Jacobi converges for the stencil's eigenvalue range on regular grids, and the residual is returned so a cage where it does not hold is detected. Limitation: semi-sharp creases are not modelled.
 * @evidence contracts/common.md#clear-and-simple-design A plain loop over compressed rows into two caller buffers, so a cage refitted every frame allocates nothing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every solve starts from the targets, never from a previous frame's controls, so the result depends on this pose alone.
 * @evidence contracts/common.md#meaningful-documentation States the system, the solver, its start, its stopping rule, holding and the return value.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices and S stencil terms: O(V + S) per sweep, at most 2,000 sweeps; a regular grid's slowest mode decays by 8/9 per sweep, so about 200 reach the tolerance; no allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The stencils are the reuse; each call solves one set of targets.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; writes only the two caller buffers.
 */
export const solveAutoMovieSubdivisionLimit: (props: {
  stencil: IAutoMovieSubdivisionStencil;
  targets: ArrayLike<number>;
  free: Uint8Array;
  positions: { [index: number]: number; length: number };
  scratch: { [index: number]: number; length: number };
}) => number = (props: {
  stencil: IAutoMovieSubdivisionStencil;
  targets: ArrayLike<number>;
  free: Uint8Array;
  positions: { [index: number]: number; length: number };
  scratch: { [index: number]: number; length: number };
}): number => {
  const { stencil, targets, free } = props;
  const count: number = stencil.count;
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
  let positions: { [index: number]: number; length: number } = props.positions;
  let next: { [index: number]: number; length: number } = props.scratch;
  for (let k: number = 0; k < 3 * count; ++k) {
    positions[k] = targets[k]!;
    next[k] = targets[k]!;
  }
  let residual: number = 0;
  for (let iteration: number = 0; iteration < MAX_ITERATIONS; ++iteration) {
    residual = 0;
    for (let i: number = 0; i < count; ++i) {
      if (free[i] === 0) continue;
      let x: number = 0;
      let y: number = 0;
      let z: number = 0;
      for (
        let k: number = stencil.offsets[i]!;
        k < stencil.offsets[i + 1]!;
        ++k
      ) {
        const j: number = stencil.indices[k]!;
        const w: number = stencil.weights[k]!;
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
    const swap: { [index: number]: number; length: number } = positions;
    positions = next;
    next = swap;
  }
  // the converged sweep read `positions`; the caller's buffer receives it
  if (positions !== props.positions)
    for (let k: number = 0; k < 3 * count; ++k)
      props.positions[k] = positions[k]!;
  return residual;
};
