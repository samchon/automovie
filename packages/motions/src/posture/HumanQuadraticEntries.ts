import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";

/** The alternatives of `HumanQuadraticEntriesOut2`'s site. */
type HumanQuadraticEntriesOut2 = "index" | "coef";

/** The alternatives of `HumanQuadraticEntriesOut`'s site. */
type HumanQuadraticEntriesOut = "index" | "coef";

/** The alternatives of `HumanQuadraticEntriesOriginal`'s site. */
type HumanQuadraticEntriesOriginal = "index" | "coef";

/** The alternatives of `HumanQuadraticEntriesKnown`'s site. */
type HumanQuadraticEntriesKnown = "index" | "coef";

/** The alternatives of `HumanQuadraticEntriesResult`'s site. */
type HumanQuadraticEntriesResult = "index" | "coef";

/**
 * Restore an admitted row's original ordered zeros for a product whose operand
 * became nonfinite. Finite products use the compressed CSR directly; IEEE-754
 * zero times infinity or NaN must retain the original propagation. Positive
 * finite Ruiz factors preserve each raw signed zero, while every originally
 * nonzero coefficient reads its completed scaled CSR value. A fixed model can
 * omit raw rows whose full original layout is already in CSR; those rows
 * restore directly from the owned ordered entries. ECMAScript specifies the
 * exceptional product and signed-zero rules:
 * https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-numeric-types-number-multiply
 *
 * @param s Current owner borrowing unchanged admitted raw rows for one-shot
 *   solve, or owning copies of zero-bearing layouts for a fixed model; absent
 *   raw rows are complete in CSR.
 * @param r Original row number, in the same order as the compressed offsets.
 * @returns An owner-local restored row; indices borrow the unchanged raw layout
 *   when present and otherwise copy the complete CSR row.
 */
export function HumanQuadraticEntries(
  s: B.IScaled,
  r: number,
): Pick<
  IAutoMovieMotionHumanQuadraticProgram.IRow,
  HumanQuadraticEntriesResult
> {
  const known:
    | Pick<
        IAutoMovieMotionHumanQuadraticProgram.IRow,
        HumanQuadraticEntriesKnown
      >
    | undefined = s.restored?.get(r);
  if (known !== undefined) return known;
  const original:
    | Pick<
        IAutoMovieMotionHumanQuadraticProgram.IRow,
        HumanQuadraticEntriesOriginal
      >
    | undefined = s.raw[r];
  if (original === undefined) {
    const first: number = s.start[r]!;
    const length: number = s.start[r + 1]! - first;
    const index: number[] = new Array(length);
    const coef: number[] = new Array(length);
    for (let a: number = 0; a < length; ++a) {
      index[a] = s.cols[first + a]!;
      coef[a] = s.vals[first + a]!;
    }
    const out: Pick<
      IAutoMovieMotionHumanQuadraticProgram.IRow,
      HumanQuadraticEntriesOut
    > = { index, coef };
    (s.restored ??= new Map()).set(r, out);
    return out;
  }
  const coef: number[] = new Array(original.coef.length);
  let at: number = s.start[r]!;
  for (let a: number = 0; a < coef.length; ++a) {
    const value: number = original.coef[a]!;
    coef[a] = value === 0 ? value : s.vals[at++]!;
  }
  const out: Pick<
    IAutoMovieMotionHumanQuadraticProgram.IRow,
    HumanQuadraticEntriesOut2
  > = { index: original.index, coef };
  (s.restored ??= new Map()).set(r, out);
  return out;
}
