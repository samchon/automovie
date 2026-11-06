/*
 * Copyright 2022 University of Oxford Control Group
 * SPDX-License-Identifier: Apache-2.0
 *
 * Modified for AutoMovie: TypeScript specialization for diagonal PSD QPs
 * with zero/nonnegative cones and engine-owned numerical workspaces.
 * Adapted from Clarabel.rs 0.11.1, revision
 * 25540f559592068d0c8a80e46ded1b21760212a1.
 * Original source: src/qdldl/qdldl.rs; src/solver/core/kktsolvers/direct/quasidef/directldlkktsolver.rs
 * License: ../../vendor/clarabel/licenses/clarabel-0.11.1/LICENSE.md
 */

import { IAutoMovieQuadraticConicProgram } from "./IAutoMovieQuadraticConicProgram";
import { addAutoMovieQuadraticProduct } from "./addAutoMovieQuadraticProduct";
import { orderAutoMovieQuadraticMatrix } from "./orderAutoMovieQuadraticMatrix";

/**
 * Own sparse LDL-transpose factors of [diag(P), A'; A, -diag(H)]. H is zero
 * for equality rows and s/z for inequalities. Symbolic elimination and ordering
 * are reused within this solve; only diagonal values change between iterations.
 * Davis's left-looking elimination-tree LDL algorithm computes actual fill.
 * Signed static/dynamic pivot stabilization affects factors only; every solve
 * refines against the original, unregularized KKT matrix.
 * Twofold product sums retain cancellation in elimination, substitution and
 * original-system residuals; rounded residuals cannot certify their own error.
 *
 * The regularization/refinement constants retain Clarabel 0.11.1 defaults.
 * Finite refinement is not a convergence proof: the interior-point owner must
 * still establish the original primal/dual residual and objective-gap tests.
 *
 * @evidence contracts/common.md#principled-implementation Sparse symmetric permutation and elimination-tree LDL factor the quasi-definite stabilized KKT. Signed 1e-8 static shifts and signed 2e-7 dynamic pivots below 1e-13 are confined to factors; up to ten corrections use the unchanged KKT residual, following the preceding Clarabel configuration and Davis's sparse LDL algorithm.
 * @evidence contracts/common.md#clear-and-simple-design The factor owns ordering, symbolic fill, numeric updates and original-system refinement; it knows no homogeneous scalars, caller geometry or termination status.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coefficient is thresholded or copied into a modified authored objective. Nonfinite factors or solves refuse, and finite factor output alone never becomes solved status.
 * @evidence contracts/common.md#meaningful-documentation Documents the matrix, equality diagonal, reuse, factor-only stabilization, original-system refinement and finite-precision limitation.
 * @evidence contracts/performance.md#efficient-algorithms For N=n+m and L actual factor nonzeros, storage is O(N+nnz(A)+L); symbolic work follows elimination paths, numeric work follows factor column intersections and each triangular solve costs O(N+L). No dense N-by-N array is created.
 * @evidence contracts/performance.md#reuse-equivalent-work Permutation, elimination tree, column pointers and numeric/refinement workspaces serve all updates of one immutable sparse structure; changing only H requires numeric refactorization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned call-owned closure retains only its sparse structure and bounded work vectors; no cross-call factor, module, host handle or native instance is retained.
 */
export function createAutoMovieQuadraticFactor(data: IAutoMovieQuadraticConicProgram): {
  update(h: Float64Array): boolean;
  solve(rhs: Float64Array): Float64Array | undefined;
  nonzeros: number;
} {
  const size: number = data.n + data.m;
  const order: Int32Array = orderAutoMovieQuadraticMatrix(data);
  const inverse: Int32Array = new Int32Array(size);
  for (let at: number = 0; at < size; at++) inverse[order[at]!] = at;
  const entries: { row: number; value: number }[][] = Array.from({ length: size }, (): { row: number; value: number }[] => []);
  for (let column: number = 0; column < data.n; column++)
    for (let at: number = data.columns[column]!; at < data.columns[column + 1]!; at++) {
      const a: number = inverse[column]!;
      const b: number = inverse[data.n + data.rows[at]!]!;
      entries[Math.max(a, b)]!.push({ row: Math.min(a, b), value: data.values[at]! });
    }
  const ap: Int32Array = new Int32Array(size + 1);
  const ai: Int32Array = new Int32Array(size + data.values.length);
  const av: Float64Array = new Float64Array(ai.length);
  const diagonal: Int32Array = new Int32Array(size);
  let cursor: number = 0;
  for (let column: number = 0; column < size; column++) {
    entries[column]!.sort((a: { row: number }, b: { row: number }): number => a.row - b.row);
    for (const entry of entries[column]!) {
      ai[cursor] = entry.row;
      av[cursor++] = entry.value;
    }
    diagonal[column] = cursor;
    ai[cursor++] = column;
    ap[column + 1] = cursor;
    entries[column]!.length = 0;
  }

  // Symbolic elimination determines exact storage before numeric iterations.
  const parent: Int32Array = new Int32Array(size).fill(-1);
  const marks: Int32Array = new Int32Array(size).fill(-1);
  const counts: Int32Array = new Int32Array(size);
  for (let column: number = 0; column < size; column++) {
    marks[column] = column;
    for (let at: number = ap[column]!; at < ap[column + 1]!; at++) {
      let row: number = ai[at]!;
      while (marks[row] !== column) {
        if (parent[row] === -1) parent[row] = column;
        counts[row]++;
        marks[row] = column;
        row = parent[row]!;
      }
    }
  }
  const lp: Int32Array = new Int32Array(size + 1);
  let fill: number = 0;
  for (let column: number = 0; column < size; column++) {
    fill += counts[column]!;
    if (fill > 0x7fffffff) throw new Error("Quadratic sparse factor exceeds int32 storage.");
    lp[column + 1] = fill;
  }
  const li: Int32Array = new Int32Array(fill);
  const lx: Float64Array = new Float64Array(fill);
  const pivots: Float64Array = new Float64Array(size);
  const y: Float64Array = new Float64Array(2 * size);
  const sums: Float64Array = new Float64Array(2 * size);
  const residualSums: Float64Array = new Float64Array(2 * size);
  const pivotSum: Float64Array = new Float64Array(2);
  const pattern: Int32Array = new Int32Array(size);
  const path: Int32Array = new Int32Array(size);
  const solution: Float64Array = new Float64Array(size);
  const trial: Float64Array = new Float64Array(size);
  const error: Float64Array = new Float64Array(size);
  const correction: Float64Array = new Float64Array(size);
  let valid: boolean = false;

  /** Solve the currently stabilized factors in permuted coordinates. */
  const substitute: (target: Float64Array, rhs: Float64Array) => void = (target: Float64Array, rhs: Float64Array): void => {
    sums.fill(0);
    for (let at: number = 0; at < size; at++) sums[2 * at] = rhs[at]!;
    for (let column: number = 0; column < size; column++) {
      target[column] = sums[2 * column]! + sums[2 * column + 1]!;
      for (let at: number = lp[column]!; at < lp[column + 1]!; at++)
        addAutoMovieQuadraticProduct(sums, li[at]!, -lx[at]!, target[column]!);
    }
    for (let column: number = size - 1; column >= 0; column--) {
      sums[2 * column] = target[column]! / pivots[column]!;
      sums[2 * column + 1] = 0;
      for (let at: number = lp[column]!; at < lp[column + 1]!; at++)
        addAutoMovieQuadraticProduct(sums, column, -lx[at]!, target[li[at]!]!);
      target[column] = sums[2 * column]! + sums[2 * column + 1]!;
    }
  };

  /** Residual uses av's true diagonal, never its factor stabilization. */
  const residual: (rhs: Float64Array, x: Float64Array) => number = (rhs: Float64Array, x: Float64Array): number => {
    residualSums.fill(0);
    for (let at: number = 0; at < size; at++) residualSums[2 * at] = rhs[at]!;
    for (let column: number = 0; column < size; column++)
      for (let at: number = ap[column]!; at < ap[column + 1]!; at++) {
        const row: number = ai[at]!;
        addAutoMovieQuadraticProduct(residualSums, row, -av[at]!, x[column]!);
        if (row !== column)
          addAutoMovieQuadraticProduct(residualSums, column, -av[at]!, x[row]!);
      }
    let norm: number = 0;
    for (let at: number = 0; at < size; at++) {
      error[at] = residualSums[2 * at]! + residualSums[2 * at + 1]!;
      norm = Math.max(norm, Math.abs(error[at]!));
    }
    return norm;
  };
  return {
    nonzeros: fill,
    /** Recompute numeric factors after replacing only the cone diagonal. */
    update(h: Float64Array): boolean {
      valid = false;
      let maxDiagonal: number = 0;
      for (let column: number = 0; column < size; column++) {
        const original: number = order[column]!;
        const value: number = original < data.n ? data.p[original]! : -h[original - data.n]!;
        av[diagonal[column]!] = value;
        maxDiagonal = Math.max(maxDiagonal, Math.abs(value));
      }
      const shift: number = 1e-8 + Number.EPSILON * Number.EPSILON * maxDiagonal;
      counts.fill(0);
      marks.fill(-1);
      y.fill(0);
      for (let column: number = 0; column < size; column++) {
        let top: number = size;
        marks[column] = column;
        const sign: number = order[column]! < data.n ? 1 : -1;
        pivotSum[0] = av[diagonal[column]!]!;
        pivotSum[1] = 0;
        addAutoMovieQuadraticProduct(pivotSum, 0, sign, shift);
        for (let at: number = ap[column]!; at < diagonal[column]!; at++) {
          let row: number = ai[at]!;
          addAutoMovieQuadraticProduct(y, row, av[at]!, 1);
          let length: number = 0;
          while (marks[row] !== column) {
            path[length++] = row;
            marks[row] = column;
            row = parent[row]!;
          }
          while (length !== 0) pattern[--top] = path[--length]!;
        }
        for (; top < size; top++) {
          const row: number = pattern[top]!;
          const value: number = y[2 * row]! + y[2 * row + 1]!;
          y[2 * row] = 0;
          y[2 * row + 1] = 0;
          const end: number = lp[row]! + counts[row]!;
          for (let at: number = lp[row]!; at < end; at++)
            addAutoMovieQuadraticProduct(y, li[at]!, -lx[at]!, value);
          const factor: number = value / pivots[row]!;
          addAutoMovieQuadraticProduct(pivotSum, 0, -value, factor);
          li[end] = column;
          lx[end] = factor;
          counts[row]++;
        }
        let pivot: number = pivotSum[0]! + pivotSum[1]!;
        if (pivot * sign < 1e-13) pivot = sign * 2e-7;
        if (!Number.isFinite(pivot) || pivot === 0) return false;
        pivots[column] = pivot;
      }
      valid = true;
      return true;
    },
    /** Return an owned solution, or refuse nonfinite factors/refinement. */
    solve(rhs: Float64Array): Float64Array | undefined {
      if (!valid || rhs.length !== size) return undefined;
      const permuted: Float64Array = new Float64Array(size);
      let normb: number = 0;
      for (let at: number = 0; at < size; at++) {
        permuted[at] = rhs[order[at]!]!;
        normb = Math.max(normb, Math.abs(permuted[at]!));
      }
      substitute(solution, permuted);
      let norm: number = residual(permuted, solution);
      if (!Number.isFinite(norm)) return undefined;
      for (let pass: number = 0; pass < 10 && norm > 1e-12 + 1e-13 * normb; pass++) {
        substitute(correction, error);
        for (let at: number = 0; at < size; at++) trial[at] = solution[at]! + correction[at]!;
        const next: number = residual(permuted, trial);
        if (!Number.isFinite(next)) return undefined;
        if (next < norm) solution.set(trial);
        const ratio: number = norm / next;
        norm = next;
        if (ratio < 5) break;
      }
      const result: Float64Array = new Float64Array(size);
      for (let at: number = 0; at < size; at++) {
        if (!Number.isFinite(solution[at])) return undefined;
        result[order[at]!] = solution[at]!;
      }
      return result;
    },
  };
}
