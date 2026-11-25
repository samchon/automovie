import type { IAutoMovieCaptureCellComparison } from "./IAutoMovieCaptureCellComparison.js";
import type { IAutoMovieCaptureFindingDiff } from "./IAutoMovieCaptureFindingDiff.js";

/**
 * How one capture compared against an earlier round, cell by cell and finding
 * by finding, as `compareAutoMovieCaptureRounds` writes it to `comparison.json`
 * and the record keeps it.
 *
 * `.agents/skills/visual-debugging/comparison.md` pairs two cells only when
 * everything but the compared thing agrees, and reports each cell without a
 * comparable counterpart as unmatched with its cause. A pair is measured pixel
 * by pixel only when both stills name the same backend; otherwise it is laid
 * side by side and the mode says so.
 */
export interface IAutoMovieCaptureComparison {
  /** Name of the earlier round. */
  round: string;

  /**
   * `cell` pairs by selection, second, view and pass. `time` pairs by second,
   * pass and selection. A unique time pair may have different views, as with an
   * encoded file and its source. Where a time key repeats, only unique equal
   * views pair. Both modes leave the cells unmatched when both report different
   * resolved cameras. Draw cameras compare by their settings. Other host camera
   * identifiers compare literally.
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

  /**
   * This round's inspection findings against the earlier round's, with the
   * round outcome its errors decide. Pixel defects only the stills show stay
   * with the cell entries and a person.
   */
  findings: IAutoMovieCaptureFindingDiff;
}
