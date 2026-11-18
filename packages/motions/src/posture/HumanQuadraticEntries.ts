import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";

/**
 * Restore an admitted row's original ordered zeros for a product whose
 * operand became nonfinite. Finite products use the compressed CSR directly;
 * IEEE-754 zero times infinity or NaN must retain the original propagation.
 * Positive finite Ruiz factors preserve each raw signed zero, while every
 * originally nonzero coefficient reads its completed scaled CSR value.
 * A fixed model can omit raw rows whose full original layout is already
 * in CSR; those rows restore directly from the owned ordered entries.
 * ECMAScript specifies the exceptional product and signed-zero rules:
 * https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-numeric-types-number-multiply
 *
 * @param s Current owner borrowing unchanged admitted raw rows for one-shot solve, or owning copies of zero-bearing layouts for a fixed model; absent raw rows are complete in CSR.
 * @param r Original row number, in the same order as the compressed offsets.
 * @returns An owner-local restored row; indices borrow the unchanged raw layout when present and otherwise copy the complete CSR row.
 *
 * @evidence contracts/development/implementation.md#principled-implementation IEEE-754 multiplication by a nonfinite operand distinguishes an actual zero term from an absent term; reconstructs the original coefficient sequence using the same finite positive scales and completed nonzero values.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One exceptional-row owner serves ADMM, residual, certificate, outer-product and polishing readers; their finite paths retain the existing compressed loops.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Restores every original signed zero, index, duplicate and ordering position without a fabricated NaN, tolerance, retry or blanket rejection of truly empty rows.
 * @evidence contracts/development/implementation.md#efficient-algorithms First restoration takes O(k) time/storage for k original row entries; repeated exceptional reads take O(1) lookup. Normal finite products allocate no restored row.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Admitted raw layouts and prepared scales stay unchanged for their synchronous one-shot loan or fixed-model snapshot; each original nonzero maps in order to one CSR entry. Complete zero-free rows need no raw copy, while zero-bearing layouts preserve every omitted entry.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Lazily retains at most one restored row per original row, O(R) total entries; zero-free model rows copy both arrays and other indices borrow unchanged layouts. One-shot maps release at return, fixed-model maps at owner collection, and neither enters preparation or public state.
 * @evidence contracts/development/common.md#meaningful-documentation States why exceptional products need zeros, complete-CSR restoration, unchanged-layout premises, empty behavior and one-shot versus fixed-model lifetime.
 */
export function HumanQuadraticEntries(
  s: B.IScaled,
  r: number,
): Pick<IAutoMovieMotionHumanQuadraticProgram.IRow, "index" | "coef"> {
  const known: Pick<IAutoMovieMotionHumanQuadraticProgram.IRow, "index" | "coef"> | undefined = s.restored?.get(r);
  if (known !== undefined) return known;
  const original: Pick<IAutoMovieMotionHumanQuadraticProgram.IRow, "index" | "coef"> | undefined = s.raw[r];
  if (original === undefined) {
    const first: number = s.start[r]!;
    const length: number = s.start[r + 1]! - first;
    const index: number[] = new Array(length);
    const coef: number[] = new Array(length);
    for (let a: number = 0; a < length; ++a) {
      index[a] = s.cols[first + a]!;
      coef[a] = s.vals[first + a]!;
    }
    const out: Pick<IAutoMovieMotionHumanQuadraticProgram.IRow, "index" | "coef"> = { index, coef };
    (s.restored ??= new Map()).set(r, out);
    return out;
  }
  const coef: number[] = new Array(original.coef.length);
  let at: number = s.start[r]!;
  for (let a: number = 0; a < coef.length; ++a) {
    const value: number = original.coef[a]!;
    coef[a] = value === 0 ? value : s.vals[at++]!;
  }
  const out: Pick<IAutoMovieMotionHumanQuadraticProgram.IRow, "index" | "coef"> = { index: original.index, coef };
  (s.restored ??= new Map()).set(r, out);
  return out;
}
