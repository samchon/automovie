import type { AutoMovieGuidePass } from "@automovie/interface";

/**
 * Caller-selected route/base/query, Chrome path, positive capture interval/rate, pixel dimensions, target, artifact destinations and guide passes for the existing render CLI. CLI parsing checks finite positivity/even dimensions and canonical pass names; direct function callers receive the canonical render/capture owner's validation rather than validation by this erased shape.
 *
 * @author Samchon
 */
export interface IAutoMoviePlaygroundRenderAndSeeOptions {
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
