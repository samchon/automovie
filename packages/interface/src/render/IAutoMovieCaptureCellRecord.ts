import type { IAutoMovieCaptureResolution } from "./IAutoMovieCaptureResolution";
import type { IAutoMovieCaptureSelection } from "./IAutoMovieCaptureSelection";
import type { IAutoMovieCaptureTime } from "./IAutoMovieCaptureTime";

/**
 * Records what a planned capture cell draws, its sheet position and its outcome.
 *
 * The capture run creates one record per planned cell. Consumers borrow its
 * nested selection, time and resolution data, which may remain mutable.
 * Subject time, sheet position and pixel hash identify different aspects of the
 * cell.
 */
export type IAutoMovieCaptureCellRecord = {
  /** Position in the plan, from zero. */
  index: number;

  /** The cell's name, its still's file stem. */
  name: string;

  /** Which objects the cell draws. */
  selection: IAutoMovieCaptureSelection;

  /** The instant drawn. */
  time: IAutoMovieCaptureTime;

  /** The view text drawn through. */
  view: string;

  /** The shade drawn in. */
  pass: string;

  /** Label of the subject's named instant at the cell's second, or null when the second is not one. */
  label: string | null;

  /** File name of the sheet the cell is on. */
  sheet: string;

  /** Row of the cell on its sheet, from zero at the top. */
  row: number;

  /** Column of the cell on its sheet, from zero at the left. */
  column: number;
} & (
  | {
      /** The still was drawn and written. */
      state: "drawn";

      /** File name of the still. */
      file: string;

      /** Content hash of the still's pixels, from `AutoMovieRenderPicture.hashRasterImage`. */
      hash: string;

      /** SHA-256 of the stored still's encoded file bytes when provided by the host. */
      fileSha256?: string;

      /** Identity of the renderer that drew it, or null when the host did not state it. */
      backend: string | null;

      /**
       * Resolved camera as written by the host, or null if omitted. A draw page
       * writes its `IAutoMovieInspectionCamera` as JSON.
       */
      camera: string | null;

      /**
       * A fixed view with its scale and up direction when needed. A later round
       * copies the text to draw the same camera. Null if the host omitted it.
       */
      repeat: string | null;

      /** Topmost resolved paths and counts for each request and view pattern, or null if omitted. */
      resolved: IAutoMovieCaptureResolution[] | null;
    }
  | {
      /** The draw function failed; the sheet shows a marked cell in its place. */
      state: "failed";

      /** The failure's message. */
      cause: string;
    }
);
