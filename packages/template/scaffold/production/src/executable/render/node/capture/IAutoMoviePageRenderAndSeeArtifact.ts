import type { IAutoMovieRenderAndSeeResult } from "@automovie/render";

/**
 * Existing render result plus the fully resolved route, JSON destination, encoder identity and pixel viewport. This report records captured files/encoding facts, not a measured visual-quality score or proof of anatomical health; underlying result arrays are borrowed into this wrapper.
 *
 *
 * @evidence contracts/development/design.md#principled-representation The canonical Render result is extended with the observed route, viewport, JSON destination and actual H264 encoder identity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Extending IAutoMovieRenderAndSeeResult keeps schedule and output metadata under Render ownership.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The artifact reports captured output without asserting anatomical quality or photographic fidelity.
 * @evidence contracts/development/common.md#meaningful-documentation The member comments identify the route, serializer destination, encoder and viewport dimensions.
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
