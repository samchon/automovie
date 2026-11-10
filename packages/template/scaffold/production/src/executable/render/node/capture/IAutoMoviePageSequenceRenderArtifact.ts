import type { IAutoMovieSequenceRenderAndSeeResult } from "@automovie/render";

import type { IAutoMovieSequenceDissolvePixelCheck } from "./IAutoMovieSequenceDissolvePixelCheck.js";

/**
 * Existing sequence render plan/result augmented with route, JSON destination, H.264 encoder identity, pixel viewport, page duration/shot order and one diagnostic dissolve observation per transition. It preserves underlying result data and reports the limited distance heuristic rather than asserting model health or exact linear blending.
 *
 *
 * @evidence contracts/development/design.md#principled-representation The canonical sequence result gains route, viewport, source page metadata and heuristic dissolve observations from the completed capture.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Extending IAutoMovieSequenceRenderAndSeeResult preserves the single sequence planning authority.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Dissolve diagnostics retain failed observations and reasons rather than presenting them as a compositor proof.
 * @evidence contracts/development/common.md#meaningful-documentation The declaration documents encoder, viewport, page duration and shot order, output JSON and diagnostic checks.
 */
export interface IAutoMoviePageSequenceRenderArtifact extends IAutoMovieSequenceRenderAndSeeResult {
  /** Fully resolved headless route, including capture query parameters. */
  route: string;

  /** Path where this artifact is serialized. */
  jsonPath: string;

  /** Encoder implementation used to materialize the preview. */
  encoder: "h264-mp4-encoder";

  /** Pixel dimensions supplied to both the browser viewport and render plan. */
  viewport: {
    /** Requested browser and render-plan width, in pixels. */
    width: number;

    /** Requested browser and render-plan height, in pixels. */
    height: number;
  };

  /** Minimal page facts needed to interpret the captured sequence. */
  page: {
    /** Page-reported sequence runtime in seconds, rather than an observed encoded duration. */
    duration: number;

    /** Page-reported shot ids in authored order. */
    shots: string[];
  };

  /** Per-transition pixel observations made from isolated shot probes. */
  dissolveChecks: IAutoMovieSequenceDissolvePixelCheck[];
}
