import type { IAutoMovieCaptureCellComparison } from "./IAutoMovieCaptureCellComparison.js";

/**
 * How one capture compared against an earlier round, cell by cell, as
 * `compareAutoMovieCaptureRounds` writes it to `comparison.json` and the record
 * keeps it.
 *
 * `.agents/skills/visual-debugging/comparison.md` pairs two cells only when
 * everything but the compared thing agrees, and reports a cell one capture
 * holds and the other lacks as unmatched with its cause. A pair is measured
 * pixel by pixel only when both stills name the same backend; otherwise it is
 * laid side by side and the mode says so.
 */
export interface IAutoMovieCaptureComparison {
  /** Name of the earlier round. */
  round: string;

  /**
   * `cell` pairs by selection, second, view and pass with the resolved camera;
   * `time` pairs by second alone, as an encoded file against its source.
   */
  match: "cell" | "time";

  /** Largest channel difference in bytes counted as unchanged. */
  tolerance: number;

  /**
   * One entry per cell of either capture, in this capture's order, then the
   * earlier round's cells this one lacks.
   */
  entries: IAutoMovieCaptureCellComparison[];

  /**
   * File names of the comparison sheets, each entry three consecutive cells:
   * the earlier still, this capture's still and their difference.
   */
  sheets: string[];
}
