import type { IAutoMovieSequenceRenderAndSeeResult } from "@automovie/render";
import type { IAutoMovieSequenceDissolvePixelCheck } from "./IAutoMovieSequenceDissolvePixelCheck";

/**
 * Existing sequence render plan/result augmented with route, JSON destination, H.264 encoder identity, pixel viewport, page duration/shot order and one diagnostic dissolve observation per transition. It preserves underlying result data and reports the limited distance heuristic rather than asserting model health or exact linear blending.
 *
 * @evidence contracts/common.md#principled-implementation Named dimensions, paths and canonical render/sequence references expose the existing typed capture boundary without a second protocol.
 * @evidence contracts/common.md#clear-and-simple-design The original CLI and capture function consume this record; rendering, page capture and output admission remain with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An erased type does not validate physical anatomy, resource existence, pixels or successful encoding; the comment separates requested values from observations.
 * @evidence contracts/common.md#meaningful-documentation Identifies inherited render planning/capture data, route and JSON destinations, HME implementation, supplied pixel viewport, second-valued page duration, shot order and limited per-transition observations; the plan does not certify encoded chroma or QP/CRF equivalence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Erased shape declarations perform no capture, numerical sampling or pixel iteration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Erased shape declarations own no cache or repeated runtime work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Erased shape declarations acquire no native handle; runtime owners release browser/page/encoder resources.
 *
 * @author Samchon
 */
export interface IAutoMoviePlaygroundSequenceRenderArtifact extends IAutoMovieSequenceRenderAndSeeResult {
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
