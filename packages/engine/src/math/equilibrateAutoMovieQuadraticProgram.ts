/*
 * Copyright 2022 University of Oxford Control Group
 * SPDX-License-Identifier: Apache-2.0
 *
 * Modified for AutoMovie: TypeScript specialization for diagonal PSD QPs
 * with zero/nonnegative cones and engine-owned numerical workspaces.
 * Adapted from Clarabel.rs 0.11.1, revision
 * 25540f559592068d0c8a80e46ded1b21760212a1.
 * Original source: src/solver/implementations/default/problemdata.rs
 * License: ../../vendor/clarabel/licenses/clarabel-0.11.1/LICENSE.md
 */
import { IAutoMovieQuadraticConicProgram } from "./IAutoMovieQuadraticConicProgram";

/**
 * Apply ten bounded Ruiz diagonal equilibration passes to owned conic arrays.
 * The change x=D*xhat, z=E*zhat/c is invertible; it alters neither the authored
 * objective nor constraints. Original-coordinate residuals undo every scale.
 * Bounds and pass count retain the preceding Clarabel configuration.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Ruiz infinity-norm equilibration scales the symmetric KKT data by reciprocal square-root column norms, with cumulative D/E/c in [1e-4,1e4]; zero rows retain identity scaling and all coefficients are multiplied rather than thresholded.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This owner mutates only its call-owned conic representation and records the inverse transformation for diagnostics and extraction.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No small coefficient, row or objective term is removed and no permanent regularizer enters P.
 * @evidence contracts/development/common.md#meaningful-documentation States the reversible coordinates, fixed inherited scaling bounds and independent residual ownership.
 * @evidence contracts/development/implementation.md#efficient-algorithms Ten passes cost O(n+m+nnz), with n+m temporary norm entries and no dense matrix or per-entry allocation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Norm workspaces are reused across the ten passes, while cumulative scalings preserve prior passes; no values survive another solve.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary norms are call-local and returned data retains only its existing arrays and scalar scales.
 */
export function equilibrateAutoMovieQuadraticProgram(
  data: IAutoMovieQuadraticConicProgram,
): void {
  const dn: Float64Array = new Float64Array(data.n);
  const en: Float64Array = new Float64Array(data.m);
  for (let pass: number = 0; pass < 10; pass++) {
    dn.set(data.p);
    en.fill(0);
    for (let column: number = 0; column < data.n; column++)
      for (
        let at: number = data.columns[column]!;
        at < data.columns[column + 1]!;
        at++
      ) {
        const value: number = Math.abs(data.values[at]!);
        dn[column] = Math.max(dn[column]!, value);
        en[data.rows[at]!] = Math.max(en[data.rows[at]!]!, value);
      }
    for (let column: number = 0; column < data.n; column++)
      dn[column] = Math.max(
        1e-4 / data.d[column]!,
        Math.min(1e4 / data.d[column]!, 1 / Math.sqrt(dn[column] || 1)),
      );
    for (let row: number = 0; row < data.m; row++)
      en[row] = Math.max(
        1e-4 / data.e[row]!,
        Math.min(1e4 / data.e[row]!, 1 / Math.sqrt(en[row] || 1)),
      );
    let mean: number = 0;
    let normq: number = 0;
    for (let column: number = 0; column < data.n; column++) {
      data.d[column] *= dn[column]!;
      data.p[column] *= dn[column]! * dn[column]!;
      data.q[column] *= dn[column]!;
      mean += data.p[column]! / data.n;
      normq = Math.max(normq, Math.abs(data.q[column]!));
      for (
        let at: number = data.columns[column]!;
        at < data.columns[column + 1]!;
        at++
      )
        data.values[at] *= dn[column]! * en[data.rows[at]!]!;
    }
    for (let row: number = 0; row < data.m; row++) {
      data.e[row] *= en[row]!;
      data.b[row] *= en[row]!;
    }
    if (mean !== 0 && normq !== 0) {
      const scale: number = Math.max(
        1e-4 / data.c,
        Math.min(1e4 / data.c, 1 / Math.max(mean, normq)),
      );
      data.c *= scale;
      for (let column: number = 0; column < data.n; column++) {
        data.p[column] *= scale;
        data.q[column] *= scale;
      }
    }
  }
}
