/**
 * Typed-array transport for the pinned Clarabel public-API bridge.
 * solveAutoMovieQuadraticProgram owns semantic admission and CSC construction;
 * this owner lays out aligned wasm32 buffers, invokes one fresh native solver,
 * and copies values before releasing its borrowed workspace. Coordinates have
 * the caller's declared units. No geometry, scaling or constraint is changed.
 * The reusable heap contains no retained solver instance or warm-start state.
 */
import { createAutoMovieQuadraticMemory } from "./createAutoMovieQuadraticMemory";
import { IAutoMovieQuadraticHeap } from "./IAutoMovieQuadraticHeap";

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
 * @evidence contracts/common.md#principled-implementation Packs admitted CSC coefficients into eight-byte-aligned wasm32 workspace blocks and invokes the pinned Clarabel bridge without changing the objective or constraints. Bridge API errors remain negative statuses, solver status stays distinct, and output values are copied from fresh memory views after any native growth.
 * @evidence contracts/common.md#clear-and-simple-design Owns buffer layout and transport only; assembleAutoMovieQuadraticProgram owns admission and CSC layout, createAutoMovieQuadraticMemory owns borrowed workspace lifetime, and the native bridge owns one cold solver per invocation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No variable, row or caller is special-cased. The native bridge ignores its initial pointer, so compatibility input initial is deliberately neither copied nor used to seed another solve.
 * @evidence contracts/common.md#meaningful-documentation States assembled-input premises, native status meaning, unusable unsuccessful output, cold-start behavior, caller units and separation from original residual checks.
 * @evidence contracts/performance.md#efficient-algorithms Transport and copying cost O(n+m+nnz) for variables, rows and CSC entries plus the native solve; each coefficient is transferred once and the unused initial vector allocates no workspace.
 * @evidence contracts/performance.md#reuse-equivalent-work One lazy WebAssembly reactor and its compilation are reused for sequential calls within this module; solver state is cold and each workspace receives the current arrays, so no earlier problem or warm start is reused.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The module retains its reactor and non-shrinking memory high-water pages for module lifetime. withWorkspace frees each allocation in finally on success or throw; returned primal and dual arrays are copied, while native memory growth has no application-level cap beyond wasm32 limits.
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
  const n: number = input.diagonal.length;
  const m: number = input.lower.length;
  const blocks: {
    values: readonly number[];
    integer: boolean;
    offset: number;
  }[] = [];
  let length: number = 0;
  const append: (values: readonly number [ ], integer?: boolean) => number = (values: readonly number[], integer: boolean = false): number => {
    const offset: number = length;
    // Every following double starts at an eight-byte boundary, even after an
    // odd number of int32 indices. Empty CSC arrays need no separate storage.
    length += Math.ceil((values.length * (integer ? 4 : 8)) / 8) * 8;
    blocks.push({ values, integer, offset });
    return offset;
  };
  const pColumns: number = append(
    Array.from({ length: n + 1 }, (_: unknown, i: number): number => i),
    true,
  );
  const pRows: number = append(
    Array.from({ length: n }, (_: unknown, i: number): number => i),
    true,
  );
  const diagonal: number = append(input.diagonal);
  const linear: number = append(input.linear);
  const columns: number = append(input.columns, true);
  const rows: number = append(input.rowIndices, true);
  const values: number = append(input.values);
  const lower: number = append(input.lower);
  const upper: number = append(input.upper);
  const primal: number = append(new Array<number>(n).fill(0));
  const dual: number = append(new Array<number>(m).fill(0));
  const info: number = append(new Array<number>(6).fill(0));
  memory ??= createAutoMovieQuadraticMemory();
  return memory.withWorkspace(length, (heap: IAutoMovieQuadraticHeap, base: number): ReturnType<typeof solveAutoMovieQuadraticKernel> => {
    for (const block of blocks)
      (block.integer ? heap.integers : heap.floats).set(
        block.values,
        (base + block.offset) / (block.integer ? 4 : 8),
      );
    const code: number = heap.solve(
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
      0,
      base + primal,
      base + dual,
      base + info,
    );
    // The native solve may have grown memory. Read fresh views only now.
    const at: number = (base + info) / 8;
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
