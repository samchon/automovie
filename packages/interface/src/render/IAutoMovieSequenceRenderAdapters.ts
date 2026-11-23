import type { IAutoMovieSequenceRenderFrame } from "./IAutoMovieSequenceRenderFrame.js";
import type { IAutoMovieSequenceRenderPlan } from "./IAutoMovieSequenceRenderPlan.js";

/**
 * Host I/O for sequence rendering. The capture adapter receives the resolved
 * sequence frame sample, including the live shot local time and optional
 * outgoing blend tail; drawing pixels remains the host's job.
 */
export interface IAutoMovieSequenceRenderAdapters {
  /** Capture one resolved sequence frame and return the written frame path. */
  captureFrame: (
    frame: IAutoMovieSequenceRenderFrame,
    plan: IAutoMovieSequenceRenderPlan,
  ) => Promise<string>;

  /** Encode the captured frame sequence and return the encoded output path. */
  encode: (args: string[], outputPath: string) => Promise<string>;
}
