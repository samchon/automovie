import type { IAutoMovieInspectionDiagnostics } from "../inspection/IAutoMovieInspectionDiagnostics.js";
import type { IAutoMovieCaptureBudget } from "./IAutoMovieCaptureBudget.js";
import type { IAutoMovieCaptureCellRecord } from "./IAutoMovieCaptureCellRecord";
import type { IAutoMovieCaptureFolder } from "./IAutoMovieCaptureFolder.js";

/**
 * Current rows and an already opened reference round for pixel comparison.
 * compareAutoMovieCaptureRounds requires earlier/reference on the folder, pairs
 * according to match, and writes comparison sheets through claimed names.
 * Different or absent backend identities produce side-by-side records instead
 * of numerical pixel differences.
 */
export interface IAutoMovieCaptureComparisonProps {
  /** The capture's folder, opened with the earlier round to compare against. */
  folder: IAutoMovieCaptureFolder;

  /** Name of the earlier round. */
  round: string;

  /** This capture's rows, in plan order. */
  rows: readonly IAutoMovieCaptureCellRecord[];

  /** How cells are paired. */
  match: "cell" | "time";

  /** Largest channel difference in bytes counted as unchanged. */
  tolerance: number;

  /**
   * This round's findings and coverage, reduced before the comparison; absent
   * when no drawn cell supplied diagnostics.
   */
  diagnostics?: IAutoMovieInspectionDiagnostics.IAudit;

  /** The reader the comparison sheets are laid out for. */
  budget: IAutoMovieCaptureBudget;

  /** This capture's still raster in pixels, which sizes the sheet cells. */
  raster: {
    /** Current still width in pixels used to plan comparison cells. */
    width: number;
    /** Current still height in pixels used to plan comparison cells. */
    height: number;
  };
}
