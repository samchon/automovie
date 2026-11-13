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
  entries: IAutoMovieCaptureComparison.Entry[];

  /** File names of the comparison sheets, each entry three consecutive cells: the earlier still, this capture's still and their difference. */
  sheets: string[];
}
export namespace IAutoMovieCaptureComparison {
  /**
   * One cell of either capture: paired with its counterpart, or unmatched with the cause.
   *
   * @evidence contracts/development/design.md#principled-representation A pair needs both names and a mode, a measured pair also its numbers, and an unmatched cell only the side it exists on and why; a union keyed by `state` and `mode` holds exactly those.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The numbers are `compareAutoMovieRasters`'s count, ratio, maximum and box; the difference image is named only when a pixel changed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An unmatched cell is never counted as unchanged.
   * @evidence contracts/development/common.md#meaningful-documentation States what each member holds and its unit.
   */
  export type Entry =
    | {
        /** Both captures hold the cell and their stills were measured against each other. */
        state: "paired";

        /** Both stills came from the same backend, so pixels are compared. */
        mode: "difference";

        /** Cell name in this capture. */
        current: string;

        /** Cell name in the earlier round. */
        earlier: string;

        /** Pixels whose largest channel difference exceeds the tolerance. */
        changed: number;

        /** `changed` over the pixel count. */
        ratio: number;

        /** Largest channel difference in bytes. */
        maximum: number;

        /** Smallest box holding every changed pixel, inclusive pixel bounds, or null when none changed. */
        bounds: {
          left: number;
          top: number;
          right: number;
          bottom: number;
        } | null;

        /** File name of the difference image, or null when no pixel changed. */
        difference: string | null;
      }
    | {
        /** Both captures hold the cell, drawn by different or unstated backends. */
        state: "paired";

        /** The stills are laid side by side without a difference image, because pixels from different backends are not compared. */
        mode: "side-by-side";

        /** Cell name in this capture. */
        current: string;

        /** Cell name in the earlier round. */
        earlier: string;
      }
    | {
        /** One capture holds the cell and the other does not, or one of them could not draw it. */
        state: "unmatched";

        /** Cell name in this capture, or null when only the earlier round has it. */
        current: string | null;

        /** Cell name in the earlier round, or null when it has no counterpart. */
        earlier: string | null;

        /** Why the cell is unmatched. */
        cause: string;
      };
}
