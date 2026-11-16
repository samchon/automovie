import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import type { HumanQuadraticProgram as Q } from "./HumanQuadraticProgram";

/**
 * Restore an admitted row's original ordered zeros for a product whose
 * operand became nonfinite. Finite products use the compressed CSR directly;
 * IEEE-754 zero times infinity or NaN must retain the original propagation.
 * Positive finite Ruiz factors preserve each raw signed zero, while every
 * originally nonzero coefficient reads its completed scaled CSR value.
 * ECMAScript specifies the exceptional product and signed-zero rules:
 * https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-numeric-types-number-multiply
 *
 * @param s Current solve wrapper borrowing unchanged admitted original rows; its retained numeric core owns no original-row references.
 * @param r Original row number, in the same order as the compressed offsets.
 * @returns A solve-owned restored coefficient row borrowing the unchanged original indices.
 *
 * @evidence contracts/development/implementation.md#principled-implementation IEEE-754 multiplication by a nonfinite operand distinguishes an actual zero term from an absent term; reconstructs the original coefficient sequence using the same finite positive scales and completed nonzero values.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One exceptional-row owner serves ADMM, residual, certificate, outer-product and polishing readers; their finite paths retain the existing compressed loops.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Restores every original signed zero, index, duplicate and ordering position without a fabricated NaN, tolerance, retry or blanket rejection of truly empty rows.
 * @evidence contracts/development/implementation.md#efficient-algorithms First restoration takes O(k) time/storage for k original row entries; repeated exceptional reads take O(1) lookup. Normal finite products allocate no restored row.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The synchronous problem's admitted rows and prepared scales remain unchanged; each original nonzero corresponds in order to one CSR entry, and restored rows belong only to this fresh solve wrapper.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Lazily retains at most one coefficient array per restored row, totaling at most R original entries for this solve; original indices are borrowed read-only, and neither raw rows nor this map enter the weak preparation cache or returned iterates.
 * @evidence contracts/development/common.md#meaningful-documentation States why exceptional products need zeros, their scale/order correspondence, unchanged-input premise, truly empty behavior and solve-local ownership.
 */
export function HumanQuadraticEntries(
  s: B.IScaled,
  r: number,
): Pick<Q.IRow, "index" | "coef"> {
  const known: Pick<Q.IRow, "index" | "coef"> | undefined = s.restored?.get(r);
  if (known !== undefined) return known;
  const original: Q.IRow = s.raw[r]!;
  const coef: number[] = new Array(original.coef.length);
  let at: number = s.start[r]!;
  for (let a: number = 0; a < coef.length; ++a) {
    const value: number = original.coef[a]!;
    coef[a] = value === 0 ? value : s.vals[at++]!;
  }
  const out: Pick<Q.IRow, "index" | "coef"> = { index: original.index, coef };
  (s.restored ??= new Map()).set(r, out);
  return out;
}
