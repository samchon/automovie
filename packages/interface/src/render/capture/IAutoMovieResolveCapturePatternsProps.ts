import type { IAutoMovieInspectionRequest } from "../inspection/IAutoMovieInspectionRequest.js";

/**
 * Inspection patterns and current scene paths for a capture-resolution receipt. resolveAutoMovieCapturePatterns applies the same path grammar as drawing, reporting topmost matched paths and counts without retaining scene objects.
 *
 * @evidence contracts/development/design.md#principled-representation Inspection patterns and current scene paths for a capture-resolution receipt. resolveAutoMovieCapturePatterns applies the same path grammar as drawing, reporting topmost matched paths and counts without retaining scene objects.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieCapturePatterns exchanges paths, request, view; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Inspection patterns and current scene paths for a capture-resolution receipt. resolveAutoMovieCapturePatterns applies the same path grammar as drawing, reporting topmost matched paths and counts without retaining scene objects.
 * @evidence contracts/development/common.md#meaningful-documentation Inspection patterns and current scene paths for a capture-resolution receipt. resolveAutoMovieCapturePatterns applies the same path grammar as drawing, reporting topmost matched paths and counts without retaining scene objects. The prose and members document how resolveAutoMovieCapturePatterns interprets and admits these values.
 */
export interface IAutoMovieResolveCapturePatternsProps {
  /** Object and mark paths of the drawn scene, in its order. */
  paths: readonly string[];

  /** The cell's inspection request. */
  request: IAutoMovieInspectionRequest;

  /** The cell's view text. */
  view: string;
}
