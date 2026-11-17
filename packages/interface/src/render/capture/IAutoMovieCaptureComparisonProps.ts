import type { IAutoMovieCaptureBudget } from "./IAutoMovieCaptureBudget.js";
import type { IAutoMovieCaptureFolder } from "./IAutoMovieCaptureFolder.js";
import type { IAutoMovieCaptureRecord } from "./IAutoMovieCaptureRecord.js";

/**
 * Current rows and an already opened reference round for pixel comparison. compareAutoMovieCaptureRounds requires earlier/reference on the folder, pairs according to match, and writes comparison sheets through claimed names. Different or absent backend identities produce side-by-side records instead of numerical pixel differences.
 *
 * @evidence contracts/development/design.md#principled-representation Different or absent backend identities produce side-by-side records instead of numerical pixel differences.
 * @evidence contracts/development/design.md#minimal-and-owned-surface compareAutoMovieCaptureRounds exchanges folder, round, rows, match, tolerance, budget, raster; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Different or absent backend identities produce side-by-side records instead of numerical pixel differences.
 * @evidence contracts/development/common.md#meaningful-documentation Current rows and an already opened reference round for pixel comparison. compareAutoMovieCaptureRounds requires earlier/reference on the folder, pairs according to match, and writes comparison sheets through claimed names. The prose and members document how compareAutoMovieCaptureRounds interprets and admits these values.
 */
export interface IAutoMovieCaptureComparisonProps {
  /** The capture's folder, opened with the earlier round to compare against. */
  folder: IAutoMovieCaptureFolder;

  /** Name of the earlier round. */
  round: string;

  /** This capture's rows, in plan order. */
  rows: readonly IAutoMovieCaptureRecord.Row[];

  /** How cells are paired. */
  match: "cell" | "time";

  /** Largest channel difference in bytes counted as unchanged. */
  tolerance: number;

  /** The reader the comparison sheets are laid out for. */
  budget: IAutoMovieCaptureBudget;

  /** This capture's still raster in pixels, which sizes the sheet cells. */
  raster: { 
/** Current still width in pixels used to plan comparison cells. */
width: number; 
/** Current still height in pixels used to plan comparison cells. */
height: number };
}
