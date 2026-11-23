import type { IAutoMovieSequenceRenderFrame } from "./IAutoMovieSequenceRenderFrame.js";
import type { IAutoMovieSequenceRenderPlan } from "./IAutoMovieSequenceRenderPlan.js";

/**
 * Host I/O for sequence rendering. The capture adapter receives the resolved sequence frame sample, including the live shot local time and optional outgoing blend tail; drawing pixels remains the host's job.
 *
 * @evidence contracts/development/design.md#principled-representation Sequence capture receives the fully resolved frame and the same manifest used for encoding, including outgoing blend tails.
 * @evidence contracts/development/design.md#minimal-and-owned-surface These callbacks separate host drawing and encoder effects from deterministic sequence playback resolution.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared callbacks are public host seams and do not replace renderer globals or hidden engine state.
 * @evidence contracts/development/common.md#meaningful-documentation Capture returns the actual written frame path and encode returns the actual video path, with all frame timing supplied by the plan.
 */
export interface IAutoMovieSequenceRenderAdapters {
  /**
   * Capture one resolved sequence frame and return the written frame path.
   */
  captureFrame: (
    frame: IAutoMovieSequenceRenderFrame,
    plan: IAutoMovieSequenceRenderPlan,
  ) => Promise<string>;

  /**
   * Encode the captured frame sequence and return the encoded output path.
   */
  encode: (args: string[], outputPath: string) => Promise<string>;
}
