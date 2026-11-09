import { IAutoMovieQuadraticConicProgram } from "./IAutoMovieQuadraticConicProgram";
import { IAutoMovieQuadraticHeap } from "./IAutoMovieQuadraticHeap";
import { createAutoMovieQuadraticConicProgram } from "./createAutoMovieQuadraticConicProgram";
import { createAutoMovieQuadraticMemory } from "./createAutoMovieQuadraticMemory";
import { equilibrateAutoMovieQuadraticProgram } from "./equilibrateAutoMovieQuadraticProgram";
import { solveAutoMovieQuadraticInterior } from "./solveAutoMovieQuadraticInterior";

/**
 * Solve one admitted interval CSC problem entirely in engine-owned TypeScript.
 * The public adapter owns semantic admission and original-row residual checks.
 * This boundary owns equivalent conic expansion, reversible equilibration and
 * the cold homogeneous interior-point solve. The compatibility initial vector
 * remains ignored, with no retained factors or preceding-call warm state.
 *
 * Status 1 is Solved, 2/3 are primal/dual infeasibility, 4 is AlmostSolved;
 * 5/6 are reduced-accuracy infeasibility, 7 is the iteration limit, 9 is numerical
 * refusal and 10 is insufficient progress. Only status 1 means full convergence.
 * Zero variables return negative API status with unavailable diagnostics as NaN.
 * Unsuccessful vectors must not be accepted as geometry. Historical native
 * transport and bytes remain in repository history, outside shipped product paths.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Equivalent zero/nonnegative conic expansion feeds an engine-owned Goulart/Chen homogeneous predictor-corrector with sparse LDL and original-KKT iterative refinement. Reversible diagonal equilibration leaves the authored diagonal PSD objective and every finite interval side unchanged; numerical and negative API refusals remain distinct.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Joins conic assembly, equilibration, a synchronous iterate workspace and the interior solver; semantic admission and independent original-row residuals stay at the public adapter.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No external numerical library, WebAssembly, executable, subprocess, service, fixture dispatch, objective alteration or numerical fallback is used. Initial remains ignored and failure is never relabelled as full convergence.
 * @evidence contracts/development/common.md#meaningful-documentation States input ownership, cold compatibility behavior, all reachable status meanings, unavailable setup diagnostics and the historical inactive transport boundary.
 * @evidence contracts/development/implementation.md#efficient-algorithms Assembly and scaling use O(n+m+nnz) storage/work outside bounded passes and column sorting; iteration uses a sparse factor with actual fill rather than a dense variable square. The borrowed iterate has n+2m doubles and result copies have original dimensions.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Every mutable input receives its own cold state; only one solve's symbolic structure and current factors are reused by the interior owner.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One synchronous workspace borrow ends on success or exception and result arrays copy out; all numerical arrays and factors are call-owned, with no module, native memory, handle or cache retained across calls.
 */
export function solveAutoMovieQuadraticKernel(input: {
  diagonal: readonly number[];
  linear: readonly number[];
  columns: readonly number[];
  rowIndices: readonly number[];
  values: readonly number[];
  lower: readonly number[];
  upper: readonly number[];
  initial?: readonly number[];
}): {
  status: number;
  iterations: number;
  primalResidual: number;
  dualResidual: number;
  objective: number;
  dualObjective: number;
  primal: number[];
  dual: number[];
} {
  if (input.diagonal.length === 0)
    return {
      status: -1,
      iterations: 0,
      primalResidual: NaN,
      dualResidual: NaN,
      objective: NaN,
      dualObjective: NaN,
      primal: [],
      dual: new Array<number>(input.lower.length).fill(NaN),
    };
  const data: IAutoMovieQuadraticConicProgram =
    createAutoMovieQuadraticConicProgram(input);
  equilibrateAutoMovieQuadraticProgram(data);
  return createAutoMovieQuadraticMemory().withWorkspace(
    8 * (data.n + 2 * data.m),
    (
      heap: IAutoMovieQuadraticHeap,
    ): ReturnType<typeof solveAutoMovieQuadraticKernel> =>
      solveAutoMovieQuadraticInterior(data, heap.floats, input.lower.length),
  );
}
