import type { IAutoMovieInspectionDiagnostics } from "../inspection/IAutoMovieInspectionDiagnostics.js";
import type { IAutoMovieCaptureCompleteRecord } from "./IAutoMovieCaptureCompleteRecord.js";
import type { IAutoMovieCaptureCellRecord } from "./IAutoMovieCaptureCellRecord.js";
import type { IAutoMovieCaptureTime } from "./IAutoMovieCaptureTime.js";

/**
 * The `record.json` a capture writes in its folder: enough to repeat every cell
 * and to know which were not drawn, any diagnostics from the drawn samples, and
 * the list of every file the capture owns.
 *
 * A capture writes a `running` record listing the files it is about to write
 * before it writes any, and the `complete` record last, so a folder interrupted
 * at any step still says which of its files the capture owns and the next run
 * replaces them. `.agents/skills/visual-debugging/capture.md` asks a record to
 * keep the source revision, the input, the time, the resolved camera, the pass,
 * the raster and the renderer, and to keep a cell that could not be drawn with
 * its cause.
 */
export type IAutoMovieCaptureRecord =
  | {
      /** Written before the first file; the capture has not finished. */
      state: "running";

      /** Every file name the capture may write in its folder. */
      files: string[];
    }
  | IAutoMovieCaptureCompleteRecord;

export namespace IAutoMovieCaptureRecord {
  /** The evidence of an earlier round needed for a new round's comparison. */
  export interface IComparison {
    /**
     * Earlier cells in capture order, with their comparison identity and
     * output.
     */
    readonly rows: readonly IAutoMovieCaptureCellRecord[];

    /** Earlier audit when the round recorded its inspection diagnostics. */
    readonly diagnostics?: IAutoMovieInspectionDiagnostics.IAudit;
  }

  /** A usable diagnostic record, or why the stored value supplies none. */
  export type IObservation = IObserved | IUnobserved;

  /** The already recorded facts used to verify one diagnostic selection. */
  export interface IObserved
    extends IAutoMovieInspectionDiagnostics.IObservations {
    /** The record has the required observation fields. */
    readonly type: "observed";
    /** Name of the captured subject. */
    readonly subject: string;
    /** Cell identity, clock and still information in capture order. */
    readonly rows: readonly IObservationCell[];
    /** Compared errors with incomplete coverage, in record order. */
    readonly unmatched: readonly IUnmatchedError[];
  }

  /** A capture record that cannot serve as diagnostic evidence. */
  export interface IUnobserved {
    /** No observation is available. */
    readonly type: "unobserved";
    /** Distinguishes missing, incomplete and unreadable observation data. */
    readonly reason: "missing" | "unfinished" | "malformed";
  }

  /** One recorded cell and its draw outcome. */
  export type IObservationCell = IDrawnCell | IFailedCell;

  /** A drawn still whose retained bytes can be checked by the consumer. */
  export interface IDrawnCell extends IObservedCellAddress {
    /** The cell wrote a still. */
    readonly type: "drawn";
    /** Plain name of the still inside the round. */
    readonly file: string;
    /** Historical pixel digest, when it was recorded. */
    readonly hash?: string;
    /** Digest of the stored file bytes, when it was recorded. */
    readonly fileSha256?: string;
  }

  /** A planned cell that did not draw. */
  export interface IFailedCell extends IObservedCellAddress {
    /** The cell failed to draw. */
    readonly type: "failed";
  }

  /** A compared error for which an audit lacks coverage. */
  export interface IUnmatchedError {
    /** The source-owned continuity occurrence. */
    readonly scope: string;
    /** Name of its diagnostic check. */
    readonly check: string;
    /** The check's evidence identity. */
    readonly key: string;
    /** Uncovered intervals in seconds, absent when their extent is unknown. */
    readonly uncovered?: readonly IAutoMovieInspectionDiagnostics.IInterval[];
  }

  /** Address of one sample in a capture's view, render pass and clock. */
  export interface IObservedCellAddress {
    /** Recorded view text. */
    readonly view: string;
    /** Recorded render pass. */
    readonly pass: string;
    /** Recorded subject clock and any corresponding frame. */
    readonly time: IAutoMovieCaptureTime;
  }
}
