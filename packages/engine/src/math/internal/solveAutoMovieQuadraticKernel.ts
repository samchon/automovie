import type {
  IAutoMovieQuadraticConicProgram,
  IAutoMovieQuadraticHeap,
  IAutoMovieSolveQuadraticKernel,
} from "@automovie/interface";

import { createAutoMovieQuadraticConicProgram } from "./createAutoMovieQuadraticConicProgram";
import { createAutoMovieQuadraticMemory } from "./createAutoMovieQuadraticMemory";
import { equilibrateAutoMovieQuadraticProgram } from "./equilibrateAutoMovieQuadraticProgram";
import { solveAutoMovieQuadraticInterior } from "./solveAutoMovieQuadraticInterior";

/*
 * Solve one admitted interval CSC problem entirely in engine-owned TypeScript.
 * The public adapter owns semantic admission and original-row residual checks.
 * This boundary owns equivalent conic expansion, reversible equilibration and
 * the cold homogeneous interior-point solve. The compatibility initial vector
 * remains ignored, with no retained factors or preceding-call warm state.
 *
 * Status 1 is Solved, 2/3 are primal/dual infeasibility, 4 is AlmostSolved; 5/6
 * are reduced-accuracy infeasibility, 7 is the iteration limit, 9 is numerical
 * refusal and 10 is insufficient progress. Only status 1 means full
 * convergence. Zero variables return negative API status with unavailable
 * diagnostics as NaN. Unsuccessful vectors must not be accepted as geometry.
 * Historical native transport and bytes remain in repository history, outside
 * shipped product paths.
 */
export function solveAutoMovieQuadraticKernel(
  input: IAutoMovieSolveQuadraticKernel.IInput,
): IAutoMovieSolveQuadraticKernel.IResult {
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
    (heap: IAutoMovieQuadraticHeap): IAutoMovieSolveQuadraticKernel.IResult =>
      solveAutoMovieQuadraticInterior(data, heap.floats, input.lower.length),
  );
}
