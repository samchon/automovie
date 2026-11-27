import type { IAutoMoviePlaybackEditorialMarker } from "../production/IAutoMoviePlaybackEditorialMarker";
import type { IAutoMovieSequenceRenderFrame } from "./IAutoMovieSequenceRenderFrame";
import type { IAutoMovieSequenceRenderShotSpan } from "./IAutoMovieSequenceRenderShotSpan";
import type { IAutoMovieSequenceRenderTransitionSpan } from "./IAutoMovieSequenceRenderTransitionSpan";

/**
 * Public sequence render manifest: editorial timeline, transition spans,
 * retained editorial markers, frame samples, output paths, and encoder args in
 * one deterministic artifact.
 */
export interface IAutoMovieSequenceRenderPlan {
  /** Render target identity. */
  target: {
    /** This manifest resolves a sequence rather than a single shot. */
    kind: "sequence";
    /** Sequence id matched against the render spec target by planSequenceRender. */
    id: string;
  };

  /** Sequence fps as authored by the cut. */
  sequenceFps: number;

  /** Output fps from the render spec. */
  renderFps: number;

  /** Total output seconds after transition overlaps are subtracted. */
  durationSeconds: number;

  /** Number of output frames. */
  frameCount: number;

  /** Global output sample times, one per frame. */
  times: number[];

  /** Shot spans on the output clock. */
  shots: IAutoMovieSequenceRenderShotSpan[];

  /** Incoming transition spans on the output clock. */
  transitionSpans: IAutoMovieSequenceRenderTransitionSpan[];

  /**
   * Retained editorial marker plays on the output clock. Omitted when none
   * survive.
   */
  editorialMarkers?: IAutoMoviePlaybackEditorialMarker[];

  /** Frame samples in capture order. */
  frames: IAutoMovieSequenceRenderFrame[];

  /** Directory where frame files should be written. */
  frameDir: string;

  /** First output frame path. */
  firstFrame: string;

  /** Last output frame path. */
  lastFrame: string;

  /** Ffmpeg input pattern for the frame sequence. */
  inputPattern: string;

  /** Encoded video output path. */
  outputPath: string;

  /** Exact ffmpeg argument vector for the encoded output. */
  ffmpegArgs: string[];
}
