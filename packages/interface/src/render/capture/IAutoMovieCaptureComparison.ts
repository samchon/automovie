import type { IAutoMovieCaptureCellComparison } from "./IAutoMovieCaptureCellComparison.js";

/**
 * How one capture compared against an earlier round, cell by cell, as `compareAutoMovieCaptureRounds` writes it to `comparison.json` and the record keeps it.
 *
 * `.agents/skills/visual-debugging/comparison.md` pairs two cells only when everything but the compared thing agrees, and reports a cell one capture holds and the other lacks as unmatched with its cause. A pair is measured pixel by pixel only when both stills name the same backend; otherwise it is laid side by side and the mode says so.
 *
 * @evidence contracts/development/design.md#principled-representation The compared round, the matching rule, the tolerance in bytes and one entry per cell of either capture, each either a pair with its measured difference or an unmatched cell with its cause, so nothing is silently left out.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the record and the reader; the measured numbers are those of `compareAutoMovieRasters`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A pair and an unmatched cell are union members keyed by `state`, and a side-by-side pair has no difference numbers rather than zeros.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, the pairing rule and its source, when a pair is measured, and what the entries hold.
 */
export interface IAutoMovieCaptureComparison {
  /** Name of the earlier round. */
  round: string;

  /** `cell` pairs by selection, second, view and pass with the resolved camera; `time` pairs by second alone, as an encoded file against its source. */
  match: "cell" | "time";

  /** Largest channel difference in bytes counted as unchanged. */
  tolerance: number;

  /** One entry per cell of either capture, in this capture's order, then the earlier round's cells this one lacks. */
  entries: IAutoMovieCaptureCellComparison[];

  /** File names of the comparison sheets, each entry three consecutive cells: the earlier still, this capture's still and their difference. */
  sheets: string[];
}
