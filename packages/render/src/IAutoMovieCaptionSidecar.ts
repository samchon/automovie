import type { IAutoMovieCaptionEntry } from "./IAutoMovieCaptionEntry";

/**
 * The per-beat caption track of one sequence render: the machine-readable sidecar a guide-frame consumer reads next to the captured frames.
 *
 * `planCaptionSidecar` produces it for the whole render, `sliceCaptionSidecar` re-bases it to one chunk, and `renderCaptionSidecar` serializes it.
 *
 * @evidence contracts/common.md#principled-implementation Spans are addressed in output frames at the render's `fps`, the same integer clock the captured frame files use, so a consumer maps a span to files by index without time arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design Four fields carry only what a consumer needs to place spans against frame files; the cut, shots and script stay with the planner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The `frameCount` is stated explicitly so a slice can refuse a window beyond coverage instead of inferring coverage from the last span.
 * @evidence contracts/common.md#meaningful-documentation The prose names the producer, slicer and serializer; members state the frame clock, how `frameCount` is computed, and the tiling guarantee of `entries`.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The sidecar type is data with no code; the cost of producing and slicing it is answered on its producer and slicer.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no work across phases; consumers receive the value the planner returned.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased sidecar type allocates no spans; planCaptionSidecar returns at most one span per scheduled output frame, and sliceCaptionSidecar creates the overlapping subset for its caller. Frame count and caption text have no cap in this schema.
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
