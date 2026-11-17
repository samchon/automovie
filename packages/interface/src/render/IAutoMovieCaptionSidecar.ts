import type { IAutoMovieCaptionEntry } from "./IAutoMovieCaptionEntry.js";

/**
 * The per-beat caption track of one sequence render: the machine-readable sidecar a guide-frame consumer reads next to the captured frames.
 *
 * `planCaptionSidecar` produces it for the whole render, `sliceCaptionSidecar` re-bases it to one chunk, and `renderCaptionSidecar` serializes it.
 *
 * @evidence contracts/development/design.md#principled-representation Spans are addressed in output frames at the render's `fps`, the same integer clock the captured frame files use, so a consumer maps a span to files by index without time arithmetic.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four fields carry only what a consumer needs to place spans against frame files; the cut, shots and script stay with the planner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The `frameCount` is stated explicitly so a slice can refuse a window beyond coverage instead of inferring coverage from the last span.
 * @evidence contracts/development/common.md#meaningful-documentation The prose names the producer, slicer and serializer; members state the frame clock, how `frameCount` is computed, and the tiling guarantee of `entries`.
 */
export interface IAutoMovieCaptionSidecar {
  /** Id of the sequence this sidecar captions. */
  target: string;

  /** Output frames per second the spans are addressed in. */
  fps: number;

  /**
   * Total output frames covered: `round(runtime * fps)` for a whole render, or the window length after slicing.
   */
  frameCount: number;

  /**
   * Caption spans in play order, covering every frame in `[0, frameCount)` exactly once, with adjacent spans naming different beats.
   */
  entries: IAutoMovieCaptionEntry[];
}
