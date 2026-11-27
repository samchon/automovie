import type { IAutoMovieInspectionRequest } from "./IAutoMovieInspectionRequest";

/**
 * Inspection patterns and current scene paths for a capture-resolution receipt.
 * resolveCapturePatterns applies the same path grammar as drawing,
 * reporting topmost matched paths and counts without retaining scene objects.
 */
export interface IAutoMovieResolveCapturePatternsProps {
  /** Object and mark paths of the drawn scene, in its order. */
  paths: readonly string[];

  /** The cell's inspection request. */
  request: IAutoMovieInspectionRequest;

  /** The cell's view text. */
  view: string;
}
