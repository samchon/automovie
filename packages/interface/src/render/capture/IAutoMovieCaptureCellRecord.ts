import type { IAutoMovieCaptureResolution } from "./IAutoMovieCaptureResolution.js";
import type { IAutoMovieCaptureSelection } from "./IAutoMovieCaptureSelection.js";
import type { IAutoMovieCaptureTime } from "./IAutoMovieCaptureTime.js";

/**
 * One planned cell: what fixed it, where it sits on the sheets, and whether it was drawn.
 *
 * The capture run creates one record per planned cell. Consumers borrow its nested selection, time and resolution data; the shape does not promise deep immutability. Subject-time, sheet-position and pixel-hash identities retain their separate meanings.
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

      /** The camera the view resolved to, as the host wrote it (a draw page writes the JSON of its `IAutoMovieInspectionCamera`), or null when the host did not state it. */
      camera: string | null;

      /** The view text that draws that camera again, a fixed view with its scale and up when needed, which a later round copies as is; null when the host did not state it. */
      repeat: string | null;

      /** What each pattern of the cell's request and view resolved to, topmost paths and counts, or null when the host did not state it. */
      resolved: IAutoMovieCaptureResolution[] | null;
    }
  | {
      /** The draw function failed; the sheet shows a marked cell in its place. */
      state: "failed";

      /** The failure's message. */
      cause: string;
    }
);
