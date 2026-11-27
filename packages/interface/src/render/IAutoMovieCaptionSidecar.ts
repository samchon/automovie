import type { IAutoMovieCaptionEntry } from "./IAutoMovieCaptionEntry";

/**
 * The per-beat caption track of one sequence render: the machine-readable
 * sidecar a guide-frame consumer reads next to the captured frames.
 *
 * `AutoMovieRenderCaption.planSidecar` produces it for the whole render,
 * `AutoMovieRenderCaption.sliceSidecar` re-bases it to one chunk, and
 * `AutoMovieRenderCaption.renderSidecar` serializes it.
 */
export interface IAutoMovieCaptionSidecar {
  /** Id of the sequence this sidecar captions. */
  target: string;

  /** Output frames per second the spans are addressed in. */
  fps: number;

  /**
   * Total output frames covered: `round(runtime * fps)` for a whole render, or
   * the window length after slicing.
   */
  frameCount: number;

  /**
   * Caption spans in play order, covering every frame in `[0, frameCount)`
   * exactly once, with adjacent spans naming different beats.
   */
  entries: IAutoMovieCaptionEntry[];
}
