import type {
  IAutoMovieCapturePlanRequest,
  IAutoMovieInspectionDiagnostics,
  IAutoMovieInspectionLegendEntry,
} from "@automovie/interface";
import type { IApplyAutoMovieInspectionProps } from "@automovie/render";

/**
 * A subject mounted on the inspector's canvas by
 * `mountAutoMovieInspectorScene`: the calls the component makes while it
 * lives.
 */
export interface IAutoMovieInspectorScene {
  /**
   * Draw a new request from the next frame. Before the instance is ready the
   * request is held and applied when it is.
   *
   * The inspection is re-applied when the request's inspection differs, the
   * playhead moves to the request's first second when that differs, and the
   * picture redraws. When the inspection refuses the request, such as a mark
   * pattern that matches no kind, the previous request stays drawn and is
   * reported through `IReport.refused` with the reason. The same request object
   * again does nothing.
   */
  apply(request: IAutoMovieCapturePlanRequest): void;

  /**
   * Show or hide the diagnostic witness cubes from the next frame. Checks,
   * their reports and console incidents continue either way.
   */
  overlay(show: boolean): void;

  /**
   * End the mount: cancel the pending frame, restore the inspection, dispose
   * the renderer and the instance, or dispose the instance when it arrives if
   * it has not yet. Calling it again does nothing.
   */
  dispose(): void;
}
export namespace IAutoMovieInspectorScene {
  /**
   * What joined the samples of a reported span: `frames` for checks at
   * consecutive output frames, `playback` for painted samples of one
   * uninterrupted playback, whose unpainted film in between was not checked.
   */
  export type EpisodeBasis = "frames" | "playback";

  /**
   * One console incident: a confirmed error's first visit, or a closed span of
   * its observations.
   */
  export type IIncident =
    | {
        kind: "first";
        observation: IAutoMovieInspectionDiagnostics.IObservation;
      }
    | {
        kind: "episode";
        basis: EpisodeBasis;
        episode: IAutoMovieInspectionDiagnostics.IEpisode;
        firstSample: IAutoMovieInspectionDiagnostics.ITime;
      };

  /**
   * What a mount learns about its subject once the instance is ready, for the
   * panels.
   */
  export interface IFacts {
    /**
     * Identity paths of every drawn object in scene order, then of every
     * supplied mark, at the first second drawn.
     */
    paths: string[];

    /**
     * Marks supplied at the first second drawn, which provide their kinds and
     * styles to the marks panel.
     */
    marks: NonNullable<IApplyAutoMovieInspectionProps["marks"]>;

    /**
     * Subject-declared kinds available throughout the mount, including kinds
     * with no mark at the first second.
     */
    markKinds?: IApplyAutoMovieInspectionProps["markKinds"];

    /**
     * The subject's own view names, then the named viewpoints a fitted view
     * takes.
     */
    views: string[];

    /** Width in pixels of a still of the subject. */
    width: number;

    /** Height in pixels of a still of the subject. */
    height: number;

    /** The subject's duration in seconds. */
    durationSeconds: number;

    /**
     * Frames per second of the subject's own grid, the step the time slider
     * moves by.
     */
    fps: number;
  }

  /** The labels of one paused picture, placed for the canvas as laid out. */
  export interface ILabels {
    /**
     * Each kept label: its path, its text, and its top-left corner in CSS
     * pixels from the canvas's top-left.
     */
    labels: {
      /** The labelled path. */
      path: string;

      /** The text shown. */
      text: string;

      /** CSS pixels from the canvas's left edge. */
      left: number;

      /** CSS pixels from the canvas's top edge. */
      top: number;
    }[];

    /**
     * Height of the stamp's label box in CSS pixels, which the overlap was
     * decided for.
     */
    lineHeight: number;

    /**
     * How many asked labels were dropped because they would overlap a kept one
     * or fall outside the picture.
     */
    dropped: number;
  }

  /**
   * Where a mount reports what it learns; the component turns each report into
   * state.
   */
  export interface IReport {
    /** The instance is ready and drawn once. */
    ready(facts: IFacts): void;

    /**
     * The legend of the picture, after an apply and after every draw while
     * paused.
     */
    legend(entries: IAutoMovieInspectionLegendEntry[]): void;

    /**
     * The labels the request's `label` patterns place on the picture, after
     * every draw while paused, and none once playing starts.
     */
    labels(placed: ILabels): void;

    /**
     * Why the last frame or the instance could not be drawn, or null once a
     * frame draws again.
     */
    error(message: string | null): void;

    /**
     * Findings and coverage of a painted production sample when the subject
     * provides diagnostics.
     */
    diagnostics?(packet: IAutoMovieInspectionDiagnostics): void;

    /**
     * Console evidence from the current mount's confirmed diagnostic
     * observations.
     */
    diagnosticIncident?(entry: IIncident): void;

    /**
     * The scene refused a request; `request` is the one it still draws and
     * `message` why.
     */
    refused(request: IAutoMovieCapturePlanRequest, message: string): void;
  }
}
