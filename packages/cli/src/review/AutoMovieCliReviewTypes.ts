import type { IAutoMovieCliReviewObservation } from "./IAutoMovieCliReviewObservation";

/** Named contracts for review command inputs, admitted options and reports. */
export namespace AutoMovieCliReviewTypes {
  /** Inspector playback recording options. */
  export interface InspectorOptions {
    url: string;
    seconds: number;
    out: string | null;
  }

  /** File-bound mark, rebind or replay options. */
  export interface FileOptions {
    file: string | null;
    mark: string | null;
    requested: IAutoMovieCliReviewObservation["requested"] | null;
    note: string | null;
    reviewer: IAutoMovieCliReviewObservation["reviewer"];
    decision: IAutoMovieCliReviewObservation["decision"];
    viewed: IAutoMovieCliReviewObservation["viewed"];
    out: string | null;
  }

  /** The admitted Inspector or file review option shape. */
  export type Options = InspectorOptions | FileOptions;

  /** Inputs for running `automovie review`. */
  export interface ReviewProps {
    /** The tokens after `review`. */
    args: readonly string[];

    /** The production's root folder, the working directory. */
    root: string;

    /** The environment, read for `CHROME_PATH`. */
    env: Readonly<Record<string, string | undefined>>;
  }

  /** Inputs for creating, rebinding or replaying a file review mark. */
  export interface ReviewFileProps {
    /** Admitted file review options. */
    options: FileOptions;

    /** The production root for user paths and project-installed packages. */
    root: string;

    /** Process environment used to resolve FFmpeg on replay. */
    env: Readonly<Record<string, string | undefined>>;
  }

  /** Inputs for recording Inspector playback. */
  export interface PlaybackProps {
    /** Playwright's `chromium`, loaded from the production. */
    chromium: unknown;

    /** The inspector page's address. */
    url: string;

    /** Wall-clock seconds observed after Play is pressed. */
    seconds: number;

    /** Folder the video is written into. */
    out: string;

    /** The environment, read for `CHROME_PATH`. */
    env: Readonly<Record<string, string | undefined>>;
  }

  /** One reading of the Inspector time readout. */
  export interface PlaybackReading {
    elapsedSeconds: number;
    text: string;
  }

  /** Inspector playback recording and page errors. */
  export interface PlaybackRecord {
    /** The recording. */
    video: string;

    /** Each reading of the time readout, with wall seconds since Play. */
    readings: PlaybackReading[];

    /** The page's script errors. */
    errors: string[];
  }
}
