import type { IAutoMovieRenderAndSeeResult } from "../../index.js";

/**
 * Existing render result plus the fully resolved route, JSON destination, encoder identity and pixel viewport. This report records captured files/encoding facts, not a measured visual-quality score or proof of anatomical health; underlying result arrays are borrowed into this wrapper.
 *
 *
 * @evidence contracts/common.md#principled-implementation The canonical Render result is extended with the observed route, viewport, JSON destination and actual H264 encoder identity.
 * @evidence contracts/common.md#clear-and-simple-design Extending IAutoMovieRenderAndSeeResult keeps schedule and output metadata under Render ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The artifact reports captured output without asserting anatomical quality or photographic fidelity.
 * @evidence contracts/common.md#meaningful-documentation The member comments identify the route, serializer destination, encoder and viewport dimensions.
 * @evidence contracts/performance.md#efficient-algorithms The erased extension computes nothing; the capture operation constructs the artifact after rendering.
 * @evidence contracts/performance.md#reuse-equivalent-work The artifact shares the completed Render result rather than rebuilding its frame schedule.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned metadata is caller-owned and references frame records and paths; browser and encoder handles are released before return.
 */
export interface IAutoMoviePageRenderAndSeeArtifact extends IAutoMovieRenderAndSeeResult {
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
