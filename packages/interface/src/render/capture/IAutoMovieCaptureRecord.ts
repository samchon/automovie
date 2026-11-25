import type { IAutoMovieInspectionDiagnostics } from "../inspection/IAutoMovieInspectionDiagnostics.js";
import type { IAutoMovieCaptureBudget } from "./IAutoMovieCaptureBudget.js";
import type { IAutoMovieCaptureCellRecord } from "./IAutoMovieCaptureCellRecord.js";
import type { IAutoMovieCaptureComparison } from "./IAutoMovieCaptureComparison.js";
import type { IAutoMovieCaptureLayout } from "./IAutoMovieCaptureLayout.js";
import type { IAutoMovieCaptureTime } from "./IAutoMovieCaptureTime.js";
import type { IAutoMovieCaptureVideoSource } from "./IAutoMovieCaptureVideoSource.js";
import type { IAutoMovieCaptureWindow } from "./IAutoMovieCaptureWindow.js";

/**
 * The `record.json` a capture writes in its folder: enough to repeat every cell and to know which were not drawn, any diagnostics from the drawn samples, and the list of every file the capture owns.
 *
 * A capture writes a `running` record listing the files it is about to write before it writes any, and the `complete` record last, so a folder interrupted at any step still says which of its files the capture owns and the next run replaces them. `.agents/skills/visual-debugging/capture.md` asks a record to keep the source revision, the input, the time, the resolved camera, the pass, the raster and the renderer, and to keep a cell that could not be drawn with its cause.
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
      rows: IAutoMovieCaptureCellRecord[];

      /** File names of the contact sheets, in order. */
      sheets: string[];

      /** The comparison against an earlier round, or null when none was asked. */
      comparison: IAutoMovieCaptureComparison | null;

      /** The video file the stills were taken from, with its detected cuts, or null for a drawn subject. */
      video: IAutoMovieCaptureVideoSource | null;

      /**
       * Findings and coverage for captured samples that supplied diagnostics, without a full delivery schedule.
       *
       * A scaffolded film that supplies its human performance carries the physical bounds of the whole performance in every sampled packet, so each sampled cell adds one coverage row per bound and performer and one per pair: with P performers up to 16P + P(P - 1) / 2 rows, 33 with two. A verdict is then compared between rounds only at instants both rounds sampled.
       */
      diagnostics?: IAutoMovieInspectionDiagnostics.IAudit;

      /** The subject owner's own section, such as a motion case's verdicts and metrics, as the host handed it over, or null when the owner has none. */
      section: Readonly<Record<string, unknown>> | null;

      /** Every file name the capture wrote in its folder, this record included. */
      files: string[];
    };
