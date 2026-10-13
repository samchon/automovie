import type { IAutoMovieRenderAndSeeResult } from "@automovie/render";

/**
 * Existing render result plus the fully resolved route, JSON destination, encoder identity and pixel viewport. This report records captured files/encoding facts, not a measured visual-quality score or proof of anatomical health; underlying result arrays are borrowed into this wrapper.
 *
 * @evidence contracts/common.md#principled-implementation Named dimensions, paths and canonical render/sequence references expose the existing typed capture boundary without a second protocol.
 * @evidence contracts/common.md#clear-and-simple-design The original CLI and capture function consume this record; rendering, page capture and output admission remain with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An erased type does not validate physical anatomy, resource existence, pixels or successful encoding; the comment separates requested values from observations.
 * @evidence contracts/common.md#meaningful-documentation The comment names the actual consumer, units, ownership, cost and interpretation limits.
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
  viewport: { width: number; height: number };
}
