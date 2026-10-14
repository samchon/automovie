import type { IAutoMovieSequenceRenderAndSeeResult } from "../../index.js";

import type { IAutoMovieSequenceDissolvePixelCheck } from "./IAutoMovieSequenceDissolvePixelCheck.js";

/**
 * Existing sequence render plan/result augmented with route, JSON destination, H.264 encoder identity, pixel viewport, page duration/shot order and one diagnostic dissolve observation per transition. It preserves underlying result data and reports the limited distance heuristic rather than asserting model health or exact linear blending.
 *
 *
 * @evidence contracts/common.md#principled-implementation The canonical sequence result gains route, viewport, source page metadata and heuristic dissolve observations from the completed capture.
 * @evidence contracts/common.md#clear-and-simple-design Extending IAutoMovieSequenceRenderAndSeeResult preserves the single sequence planning authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Dissolve diagnostics retain failed observations and reasons rather than presenting them as a compositor proof.
 * @evidence contracts/common.md#meaningful-documentation The declaration documents encoder, viewport, page duration and shot order, output JSON and diagnostic checks.
 * @evidence contracts/performance.md#efficient-algorithms The erased result computes nothing; its producer performs the sequence capture and observation.
 * @evidence contracts/performance.md#reuse-equivalent-work The producer reuses its canonical plan and frame records in this artifact.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the result arrays and paths; no browser page or encoder handle is retained in the artifact.
 * @author Samchon
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
