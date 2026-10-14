import type { IAutoMovieRenderAndSeeResult } from "@automovie/render";

/**
 * Existing render result plus the fully resolved route, JSON destination, encoder identity and pixel viewport. This report records captured files/encoding facts, not a measured visual-quality score or proof of anatomical health; underlying result arrays are borrowed into this wrapper.
 *
 * @evidence contracts/common.md#principled-implementation Extends the canonical render result with the actual resolved route, JSON path, encoder implementation and viewport; inherited frame paths identify the adapter-returned primary images supplied to encoding.
 * @evidence contracts/common.md#clear-and-simple-design The original CLI and capture function consume this record; rendering, page capture and output admission remain with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An erased type does not validate physical anatomy, resource existence, pixels or successful encoding; the comment separates requested values from observations.
 * @evidence contracts/common.md#meaningful-documentation States the serialized capture result, pixel viewport, route/path and encoder meanings, borrowed result arrays and the distinction from a measured visual-quality verdict.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Erased shape declarations perform no capture, numerical sampling or pixel iteration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Erased shape declarations own no cache or repeated runtime work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Erased shape declarations acquire no native handle; runtime owners release browser/page/encoder resources.
 *
 * @author Samchon
 */
export interface IAutoMoviePlaygroundRenderAndSeeArtifact extends IAutoMovieRenderAndSeeResult {
  /** Fully resolved headless route, including capture query parameters. */
  route: string;

  /** Path where this artifact is serialized. */
  jsonPath: string;

  /** Encoder implementation used to materialize the preview. */
  encoder: "h264-mp4-encoder";

  /** Pixel dimensions applied to both the browser viewport and render spec. */
  viewport: {
    /** Requested canvas and browser viewport width, in pixels. */
    width: number;

    /** Requested canvas and browser viewport height, in pixels. */
    height: number;
  };
}
