import type { AutoMovieGuidePass } from "@automovie/interface";

/**
 * Caller-selected route/base/query, Chrome path, positive capture interval/rate, pixel dimensions, target, artifact destinations and guide passes for the existing render CLI. CLI parsing checks finite positivity/even dimensions and canonical pass names; direct function callers receive the canonical render/capture owner's validation rather than validation by this erased shape.
 *
 *
 * @evidence contracts/common.md#principled-implementation Route, clock, dimensions and destinations are explicit inputs to canonical render scheduling; CLI validation admits numbers and passes before capture.
 * @evidence contracts/common.md#clear-and-simple-design One record supplies the page transport and Render output options without embedding a browser handle or solver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fields contain caller values; this erased type neither repairs bad values nor changes behavior for a route.
 * @evidence contracts/common.md#meaningful-documentation The declaration documents seconds, pixels, frame rate, destinations, pass ordering and the distinction between CLI and direct-call validation.
 * @evidence contracts/performance.md#efficient-algorithms The erased shape performs no computation; sampling and encoding costs belong to captureRenderAndSee.
 * @evidence contracts/performance.md#reuse-equivalent-work The type performs no sharing; each capture invocation consumes its own options.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The record owns strings, numbers and pass names; browser, page and encoder release belong to captureRenderAndSee.
 */
export interface IAutoMoviePageRenderAndSeeOptions {
  /** Vite page loaded for the capture. */
  page: string;

  /** Page-specific query parameters added before capture controls. */
  query: string;

  /** Base URL of the running playground server. */
  base: string;

  /** Chrome or Chromium executable used for the headless session. */
  chrome: string;

  /** Film interval captured from the page, in seconds. */
  durationSeconds: number;

  /** Frame sampling rate used by capture and encoding. */
  fps: number;

  /** Output frame width in pixels. */
  width: number;

  /** Output frame height in pixels. */
  height: number;

  /** Stable render target identity recorded in the result. */
  target: string;

  /** Destination of the encoded H.264 MP4. */
  outputPath: string;

  /** Directory receiving the source PNG sequence. */
  frameDir: string;

  /** Destination of the machine-readable capture artifact. */
  jsonPath: string;

  /** Nonempty captured passes; CLI omission selects beauty, and encoding uses beauty or the first guide. */
  passes: AutoMovieGuidePass[];
}
