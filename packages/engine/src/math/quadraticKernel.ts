/**
 * Typed-array transport for the pinned Clarabel public-API bridge.
 * solveAutoMovieQuadraticProgram owns semantic admission and CSC construction;
 * this owner lays out aligned wasm32 buffers, invokes one fresh native solver,
 * and copies values before releasing its borrowed workspace. Coordinates have
 * the caller's declared units. No geometry, scaling or constraint is changed.
 * The reusable heap contains no retained solver instance or warm-start state.
 */
import { createAutoMovieQuadraticMemory } from "./quadraticKernelMemory";

let memory: ReturnType<typeof createAutoMovieQuadraticMemory> | undefined;

/**
 * Copy one already assembled column-compressed problem through the native API.
 * The program adapter owns array lengths, index bounds and finite coefficient
 * admission. A zero-variable call reports a negative API status; the remaining
 * buffer preconditions belong to the caller. Native statuses are: 1 is Solved,
 * 2 is PrimalInfeasible, 3 is DualInfeasible, 4 is AlmostSolved. Only 1 means a
 * fully solved problem. Unsuccessful output arrays must not be used as geometry.
 * The optional initial vector is retained for caller compatibility but ignored
 * by the cold interior-point solver; no preceding call seeds the next solve.
 * Null-bound conversion and independent residual checks belong to the adapter.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Evaluates an explicitly assembled shared-displacement problem without changing its coefficients or resident geometry.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Copies complete numeric inputs and returns owned solve buffers plus native failure status before releasing intermediate storage.
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
  const n = input.diagonal.length,
    m = input.lower.length;
  const blocks: {
    values: readonly number[];
    integer: boolean;
    offset: number;
  }[] = [];
  let length = 0;
  const append = (values: readonly number[], integer = false): number => {
    const offset = length;
    // Every following double starts at an eight-byte boundary, even after an
    // odd number of int32 indices. Empty CSC arrays need no separate storage.
    length += Math.ceil((values.length * (integer ? 4 : 8)) / 8) * 8;
    blocks.push({ values, integer, offset });
    return offset;
  };
  const pColumns = append(
    Array.from({ length: n + 1 }, (_, i) => i),
    true,
  );
  const pRows = append(
    Array.from({ length: n }, (_, i) => i),
    true,
  );
  const diagonal = append(input.diagonal),
    linear = append(input.linear);
  const columns = append(input.columns, true),
    rows = append(input.rowIndices, true);
  const values = append(input.values),
    lower = append(input.lower),
    upper = append(input.upper);
  const initial = input.initial === undefined ? null : append(input.initial);
  const primal = append(new Array<number>(n).fill(0));
  const dual = append(new Array<number>(m).fill(0));
  const info = append(new Array<number>(6).fill(0));
  memory ??= createAutoMovieQuadraticMemory();
  return memory.withWorkspace(length, (heap, base) => {
    for (const block of blocks)
      (block.integer ? heap.integers : heap.floats).set(
        block.values,
        (base + block.offset) / (block.integer ? 4 : 8),
      );
    const code = heap.solve(
      n,
      m,
      input.values.length,
      base + pColumns,
      base + pRows,
      base + diagonal,
      base + linear,
      base + columns,
      base + rows,
      base + values,
      base + lower,
      base + upper,
      initial === null ? 0 : base + initial,
      base + primal,
      base + dual,
      base + info,
    );
    // The native solve may have grown memory. Read fresh views only now.
    const at = (base + info) / 8;
    return {
      status: code === 0 ? heap.floats[at] : -code,
      iterations: heap.floats[at + 1],
      primalResidual: heap.floats[at + 2],
      dualResidual: heap.floats[at + 3],
      objective: heap.floats[at + 4],
      dualObjective: heap.floats[at + 5],
      primal: Array.from(
        heap.floats.subarray((base + primal) / 8, (base + primal) / 8 + n),
      ),
      dual: Array.from(
        heap.floats.subarray((base + dual) / 8, (base + dual) / 8 + m),
      ),
    };
  });
}
