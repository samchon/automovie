import type { IAutoMovieProductionRenderLayer } from "./IAutoMovieProductionRenderLayer";

/**
 * One exact film-global frame with its transitions already resolved into
 * weighted shot layers.
 *
 * `sampleProductionRenderFrame` produces it from the builder-owned timeline,
 * where output frame and timeline frame are the same number.
 * `planProductionRenderJob` then renumbers it for a proxy tier that renders
 * every `frameStep`-th timeline frame, so the output index, the full-rate
 * timeline frame and the time are separate fields. The production render chunks
 * carry these records, and the capture host renders each layer.
 */
export interface IAutoMovieProductionRenderFrame {
  /**
   * Zero-based output frame index in this render tier; equals `timelineFrame`
   * at full rate and is `timelineFrame / frameStep` in a proxy tier.
   */
  globalFrame: number;

  /** Zero-based frame on the builder-owned full-rate film timeline. */
  timelineFrame: number;

  /**
   * Film time of this output frame in seconds, computed from the frame index
   * and the tier's rational frame rate rather than accumulated.
   */
  timeSeconds: number;

  /**
   * One layer for a hard cut or a fade, whose weight carries the fade, or two
   * layers during a dissolve, outgoing shot first, whose weights sum to one.
   */
  layers: IAutoMovieProductionRenderLayer[];
}
