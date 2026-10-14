import type { IAutoMovieRenderAndSeeResult } from "@automovie/render";

/**
 * Existing render result plus the fully resolved route, JSON destination, encoder identity and pixel viewport. This report records captured files/encoding facts, not a measured visual-quality score or proof of anatomical health; underlying result arrays are borrowed into this wrapper.
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
