import type { IAutoMovieCaptureBudget } from "./IAutoMovieCaptureBudget.js";
import type { IAutoMovieCaptureComparison } from "./IAutoMovieCaptureComparison.js";
import type { IAutoMovieCaptureLayout } from "./IAutoMovieCaptureLayout.js";
import type { IAutoMovieCaptureResolution } from "./IAutoMovieCaptureResolution.js";
import type { IAutoMovieCaptureSelection } from "./IAutoMovieCaptureSelection.js";
import type { IAutoMovieCaptureTime } from "./IAutoMovieCaptureTime.js";
import type { IAutoMovieCaptureWindow } from "./IAutoMovieCaptureWindow.js";

/**
 * The `record.json` a capture writes in its folder: enough to repeat every cell and to know which were not drawn, and the list of every file the capture owns.
 *
 * A capture writes a `running` record listing the files it is about to write before it writes any, and the `complete` record last, so a folder interrupted at any step still says which of its files the capture owns and the next run replaces them. `.agents/skills/visual-debugging/capture.md` asks a record to keep the source revision, the input, the time, the resolved camera, the pass, the raster and the renderer, and to keep a cell that could not be drawn with its cause.
 *
 * @evidence contracts/development/design.md#principled-representation A union keyed by `state`: a running capture records only what it owns, a complete one everything that repeats it. The request is kept as the named text values that repeat it, every planned cell has a row, and a drawn and an undrawn row are separate members.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Each member answers a requirement of the skill quoted above or is read by the next run (`files`) or a comparison (`rows`), `video` lists a file's cuts as `.agents/skills/visual-debugging/capture.md` asks frames around every cut, and `section` keeps what only the subject's owner judges, such as a motion case's verdicts, so the record of one capture stays one file in a folder that refuses foreign files; the subject keeps its clock and raster but not its drawables, which the request's selections already name.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An undrawn cell has no file, hash, camera or resolution instead of empty ones, and an unstated backend, camera or resolution is null.
 * @evidence contracts/development/common.md#meaningful-documentation States when each state is written and why, which skill requirements the members answer, and what the next run reads.
 */
export type IAutoMovieCaptureRecord =
  | {
      /** Written before the first file; the capture has not finished. */
      state: "running";

      /** Every file name the capture may write in its folder. */
      files: string[];
    }
  | {
      /** Written after the last file. */
      state: "complete";

      /** The subject's name, clock and raster. */
      subject: {
        /** Name of the subject. */
        name: string;

        /** Running time in seconds. */
        durationSeconds: number;

        /** Frames per second of its grid. */
        fps: number;

        /** Still width in pixels. */
        width: number;

        /** Still height in pixels. */
        height: number;
      };

      /** Source revision the host drew from, such as a commit hash. */
      revision: string;

      /** The request as the named text values that repeat it. */
      request: [key: string, value: string][];

      /** The reader the sheets were laid out for. */
      budget: IAutoMovieCaptureBudget;

      /** How the sheets were laid out. */
      layout: IAutoMovieCaptureLayout;

      /** Every instant planned. */
      times: IAutoMovieCaptureTime[];

      /** The frames planned around each event and cut, with whether the subject's bounds cut them. */
      windows: IAutoMovieCaptureWindow[];

      /** One row per planned cell, in plan order. */
      rows: IAutoMovieCaptureRecord.Row[];

      /** File names of the contact sheets, in order. */
      sheets: string[];

      /** The comparison against an earlier round, or null when none was asked. */
      comparison: IAutoMovieCaptureComparison | null;

      /** The video file the stills were taken from, with its detected cuts, or null for a drawn subject. */
      video: IAutoMovieCaptureRecord.IVideo | null;

      /** The subject owner's own section, such as a motion case's verdicts and metrics, as the host handed it over, or null when the owner has none. */
      section: Readonly<Record<string, unknown>> | null;

      /** Every file name the capture wrote in its folder, this record included. */
      files: string[];
    };
export namespace IAutoMovieCaptureRecord {
  /**
   * What a capture of a video file records about the file: its path, the threshold its cuts were detected at, and every cut with its score.
   *
   * @evidence contracts/development/design.md#principled-representation The file, the `scdet` threshold on its 0 to 100 score and each cut's second in the file's time with its score, so a reader knows which cuts the windows came from and that an empty list means none at that threshold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Written by `runAutoMovieVideoCapture`, read by the record's reader.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No cut is an empty list, not an absent member.
   * @evidence contracts/development/common.md#meaningful-documentation States what each member holds and its unit.
   */
  export interface IVideo {
    /** Path of the video file. */
    file: string;

    /** `scdet` score at which a frame started a new scene. */
    threshold: number;

    /** Every detected cut: the second its new scene starts and its score. */
    cuts: { seconds: number; score: number }[];
  }

  /**
   * One planned cell: what fixed it, where it sits on the sheets, and whether it was drawn.
   *
   * @evidence contracts/development/design.md#principled-representation The cell's fixing values and sheet position shared by both outcomes, then a drawn still's file, hash, backend, camera and the paths each of its patterns resolved to, or the cause it was not drawn.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the reader of the record and by a later comparison, which pairs rows by these values.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The two outcomes are union members keyed by `state`.
   * @evidence contracts/development/common.md#meaningful-documentation States what each member holds and its unit.
   */
  export type Row = {
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

        /** Content hash of the still's pixels, from `hashAutoMovieRasterImage`. */
        hash: string;

        /** Identity of the renderer that drew it, or null when the host did not state it. */
        backend: string | null;

        /** The camera the view resolved to, as the host wrote it (a draw page writes the JSON of its `IAutoMovieInspectionCamera`), or null when the host did not state it. */
        camera: string | null;

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
}
